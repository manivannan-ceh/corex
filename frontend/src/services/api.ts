import axios from 'axios'

const BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: number
  email: string
  name: string
  role: string
  created_at?: string
}

export interface Project {
  id: number
  name: string
  description?: string
  package_name?: string
  created_at: string
  release_count?: number
}

export interface Release {
  id: number
  project_id: number
  version_name: string
  version_code: number
  release_type: string
  channel: string
  changelog?: string
  file_size?: number
  min_sdk?: number
  target_sdk?: number
  uploaded_at: string
  created_at: string
}

export interface ShareCode {
  code: string
  expiry_time: string
  release_id: number
}

export interface ShareLink {
  token: string
  expiry_time: string
  single_use: boolean
  release_id: number
}

export interface ReleaseInfo {
  id: number
  version_name: string
  version_code: number
  channel: string
  release_type: string
  file_size?: number
  min_sdk?: number
  target_sdk?: number
  uploaded_at: string
}

export interface ProjectInfo {
  id: number
  name: string
}

export interface VerifyResult {
  valid: boolean
  release?: ReleaseInfo
  project?: ProjectInfo
  download_url?: string
  message?: string
}

export interface AuditLog {
  id: number
  user_id?: number
  user_name?: string
  user_email?: string
  action: string
  resource: string
  resource_id?: number
  details?: string
  ip_address?: string
  created_at: string
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const login = async (email: string, password: string) => {
  const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
  return res.data
}

// ─── Projects ────────────────────────────────────────────────────────────────

export const getProjects = async () => {
  const res = await api.get<{ projects: Project[] }>('/projects')
  return res.data.projects
}

export const createProject = async (data: { name: string; description?: string; package_name: string }) => {
  const res = await api.post<{ project: Project }>('/projects', data)
  return res.data.project
}

// ─── Releases ────────────────────────────────────────────────────────────────

export const getReleases = async (projectId: number) => {
  const res = await api.get<{ releases: Release[] }>(`/projects/${projectId}/releases`)
  return res.data.releases
}

export interface CreateReleaseData {
  version_name: string
  version_code: number
  release_type?: string
  channel?: string
  changelog?: string
  min_sdk?: number
  target_sdk?: number
}

export const createRelease = async (projectId: number, data: CreateReleaseData) => {
  const res = await api.post<{ release: Release; upload_url: string }>(
    `/projects/${projectId}/releases`,
    data
  )
  return res.data
}

export const uploadToS3 = async (
  uploadUrl: string,
  file: File,
  onProgress?: (pct: number) => void
) => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.onload = () => (xhr.status === 200 ? resolve() : reject(new Error(`S3 upload failed: ${xhr.status}`)))
    xhr.onerror = () => reject(new Error('S3 upload network error'))
    xhr.send(file)
  })
}

export const getDownloadUrl = async (releaseId: number) => {
  const res = await api.get<{ download_url: string }>(`/releases/${releaseId}/download`)
  return res.data.download_url
}

// ─── Sharing ─────────────────────────────────────────────────────────────────

export const generateShareCode = async (releaseId: number) => {
  const res = await api.post<ShareCode>(`/releases/${releaseId}/share/code`)
  return res.data
}

export const generateShareLink = async (
  releaseId: number,
  expiryHours: number,
  singleUse: boolean
) => {
  const res = await api.post<ShareLink>(`/releases/${releaseId}/share/link`, {
    expiry_hours: expiryHours,
    single_use: singleUse,
  })
  return res.data
}

export const verifyCode = async (code: string) => {
  const res = await api.post<VerifyResult>('/share/code/verify', { code })
  return res.data
}

export const verifyLink = async (token: string) => {
  const res = await api.get<VerifyResult>(`/share/link/${token}`)
  return res.data
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const getUsers = async () => {
  const res = await api.get<{ users: User[] }>('/users')
  return res.data.users
}

export const createUser = async (data: {
  email: string
  password: string
  name: string
  role: string
}) => {
  const res = await api.post<{ user: User }>('/users', data)
  return res.data.user
}

export const updateUserRole = async (userId: number, role: string) => {
  const res = await api.put<{ user: User }>(`/users/${userId}/role`, { role })
  return res.data.user
}

export const deleteUser = async (userId: number) => {
  await api.delete(`/users/${userId}`)
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const getAuditLogs = async () => {
  const res = await api.get<{ logs: AuditLog[] }>('/audit-logs')
  return res.data.logs
}

// ─── Delete Requests ─────────────────────────────────────────────────────────

export interface DeleteRequest {
  id: number
  resource: string
  resource_id: number
  reason: string
  requested_by: number
  requester_name: string
  requester_email: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: number
  reviewed_at?: string
  created_at: string
  resource_name?: string
}

export const createDeleteRequest = async (resource: string, resourceId: number, reason: string) => {
  const res = await api.post<{ delete_request: DeleteRequest }>('/delete-requests', {
    resource,
    resource_id: resourceId,
    reason,
  })
  return res.data.delete_request
}

export const deleteRelease = async (releaseId: number) => {
  await api.delete(`/releases/${releaseId}`)
}

export const getDeleteRequests = async (status?: string) => {
  const res = await api.get<{ delete_requests: DeleteRequest[] }>('/delete-requests', {
    params: status ? { status } : {},
  })
  return res.data.delete_requests
}

export const reviewDeleteRequest = async (id: number, approve: boolean) => {
  await api.put(`/delete-requests/${id}/review`, { approve })
}

export default api
