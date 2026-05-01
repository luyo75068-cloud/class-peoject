import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
})

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

declare module 'axios' {
  export interface AxiosInstance {
    get<T = any, R = any>(url: string, config?: AxiosRequestConfig): Promise<R>;
    post<T = any, R = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
    put<T = any, R = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<R>;
    delete<T = any, R = any>(url: string, config?: AxiosRequestConfig): Promise<R>;
  }
}

request.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    message.error(err.response?.data?.msg || '请求失败')
    return Promise.reject(err)
  }
)

export default request