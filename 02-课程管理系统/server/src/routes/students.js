import Router from '@koa/router';
import db from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { success, fail } from '../utils/response.js';

const router = new Router();

router.get('/', authenticateToken, async (ctx) => {
  const { keyword = '', className = '', status = '', courseId = '', page = 1, pageSize = 10 } = ctx.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let where = 'WHERE 1=1';
  const params = [];

  if (keyword) {
    where += ' AND (name LIKE ? OR student_no LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (className) {
    where += ' AND class_name = ?';
    params.push(className);
  }
  if (status) {
    where += ' AND status = ?';
    params.push(status);
  }

  let rows = db.prepare(`SELECT * FROM students ${where} ORDER BY created_at DESC`).all(...params);

  if (courseId) {
    rows = rows.filter(s => {
      const ids = JSON.parse(s.course_ids || '[]');
      return ids.includes(Number(courseId));
    });
  }

  const total = rows.length;
  const list = rows.slice(offset, offset + Number(pageSize)).map(s => ({
    ...s,
    course_ids: JSON.parse(s.course_ids || '[]'),
  }));

  success(ctx, { list, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/classes', authenticateToken, async (ctx) => {
  const classes = db.prepare("SELECT DISTINCT class_name FROM students WHERE class_name != '' ORDER BY class_name")
    .all()
    .map(r => r.class_name);
  success(ctx, classes);
});

router.get('/:id', authenticateToken, async (ctx) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(ctx.params.id);
  if (!student) {
    return fail(ctx, 404, '学生不存在');
  }
  student.course_ids = JSON.parse(student.course_ids || '[]');

  const courses = db.prepare('SELECT id, name FROM courses').all();
  const enrolledCourses = courses.filter(c => student.course_ids.includes(c.id));

  success(ctx, { ...student, enrolledCourses });
});

// TODO: 实现创建学生接口 POST /
// 提示：参考 API.md 中 4.4 的接口说明，以及 courses.js 中创建课程的实现
// 需要：参数校验、学号唯一性检查、插入数据库、更新选课计数
router.post('/', authenticateToken, async (ctx) => {
  const { name, student_no, class_name, phone, email, status, course_ids } = ctx.request.body;

  if (!name || !student_no) {
    return fail(ctx, 400, '姓名、学号不能为空');
  }

  const exist = db.prepare('SELECT id FROM students WHERE student_no = ?').get(student_no);
  if (exist) return fail(ctx, 400, '学号已存在');

  const courseIdsStr = Array.isArray(course_ids) ? JSON.stringify(course_ids) : '[]';

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO students (name, student_no, class_name, phone, email, status, course_ids, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    student_no,
    class_name || '',
    phone || '',
    email || '',
    status || 'active',
    courseIdsStr, // 👈 存入转换后的字符串，比如 "[1,2]"
    now,
    now
  );

  updateCourseCounts();
  success(ctx, { id: result.lastInsertRowid });
});

// TODO: 实现更新学生接口 PUT /:id
// 提示：参考 API.md 中 4.5 的接口说明，以及 courses.js 中更新课程的实现
// 需要：检查学生是否存在、学号唯一性校验、更新数据库、更新选课计数
router.put('/:id', authenticateToken, async (ctx) => {
  const { id } = ctx.params;
  const { name, student_no, class_name, phone, email, status, course_ids } = ctx.request.body;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!student) return fail(ctx, 404, '学生不存在');

  if (student_no && student_no !== student.student_no) {
    const exist = db.prepare('SELECT id FROM students WHERE student_no = ? AND id != ?').get(student_no, id);
    if (exist) return fail(ctx, 400, '学号已被使用');
  }

  const courseIdsStr = course_ids !== undefined 
    ? (Array.isArray(course_ids) ? JSON.stringify(course_ids) : '[]') 
    : null;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE students
    SET name = COALESCE(?, name),
        student_no = COALESCE(?, student_no),
        class_name = COALESCE(?, class_name),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        status = COALESCE(?, status),
        course_ids = COALESCE(?, course_ids),
        updated_at = ?
    WHERE id = ?
  `).run(name, student_no, class_name, phone, email, status, courseIdsStr, now, id); // 👈 存入转换后的字符串

  updateCourseCounts();
  success(ctx, { id: Number(id) });
});

// TODO: 实现删除学生接口 DELETE /:id
// 提示：参考 API.md 中 4.6 的接口说明，以及 courses.js 中删除课程的实现
// 需要：检查学生是否存在、删除数据库记录、更新选课计数
router.delete('/:id', authenticateToken, async (ctx) => {
  const { id } = ctx.params;
  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(id);
  if (!student) return fail(ctx, 404, '学生不存在');

  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  updateCourseCounts();
  success(ctx, {});
});

function updateCourseCounts() {
  const courses = db.prepare('SELECT id FROM courses').all();
  const students = db.prepare('SELECT course_ids FROM students').all();

  for (const course of courses) {
    const count = students.filter(s => {
      const ids = JSON.parse(s.course_ids || '[]');
      return ids.includes(course.id);
    }).length;
    db.prepare('UPDATE courses SET student_count = ? WHERE id = ?').run(count, course.id);
  }
}

export default router;
