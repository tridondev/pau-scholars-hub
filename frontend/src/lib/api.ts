const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

// DRF validation errors usually come back field-keyed, e.g.
// { "email": ["user with this email already exists."] }, not as "detail".
function flattenErrors(body: Record<string, unknown>): string {
  return Object.entries(body)
    .map(([field, msgs]) => {
      const text = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
      return field === "non_field_errors" ? text : `${field}: ${text}`;
    })
    .join(" ");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      // Let the browser set Content-Type (with boundary) for FormData uploads.
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || flattenErrors(body) || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(email: string, password: string) {
  const data = await request<{ access: string; refresh: string }>("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  institute?: string | null;
}

export async function register(payload: RegisterPayload) {
  const body: Record<string, unknown> = { ...payload };
  if (!body.institute) delete body.institute; // optional FK — omit rather than send ""
  await request("/users/register/", { method: "POST", body: JSON.stringify(body) });
  // Registration succeeded — log the new user straight in.
  return login(payload.email, payload.password);
}

export interface Institute {
  id: string;
  name: string;
  acronym: string;
  campus: string;
  country: string;
}

export function getInstitutes() {
  return request<{ results: Institute[] } | Institute[]>("/users/institutes/");
}

export interface Submission {
  id: string;
  title: string;
  submission_type: string;
  status: string;
  corresponding_author_name: string;
  sdgs: string[];
  au_agenda_areas: string[];
  created_at: string;
  published_at: string | null;
}

export function getMySubmissions() {
  return request<{ results: Submission[] }>("/submissions/");
}

export interface PaginatedSubmissions {
  count: number;
  next: string | null;
  previous: string | null;
  results: Submission[];
}

// Editor/admin overview: same endpoint as getMySubmissions, but the backend
// returns everyone's submissions for editor/admin roles (see get_queryset in
// submissions/views.py), and this supports the filters the admin dashboard needs.
export function listSubmissions(params: {
  status?: string;
  submission_type?: string;
  institute?: string;
  search?: string;
  page?: number;
} = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") query.set(k, String(v));
  });
  const qs = query.toString();
  return request<PaginatedSubmissions>(`/submissions/${qs ? `?${qs}` : ""}`);
}

export interface SubmissionStats {
  draft: number;
  submitted: number;
  editorial_screening: number;
  peer_review: number;
  revision_requested: number;
  accepted: number;
  published: number;
  rejected: number;
}

export function getSubmissionStats() {
  return request<SubmissionStats>("/submissions/stats/");
}

export function createSubmission(payload: {
  title: string;
  abstract: string;
  keywords: string[];
  submission_type: string;
  institute?: string | null;
  research_area?: string;
  sdgs?: string[];
  au_agenda_areas?: string[];
  references?: string;
}) {
  const body: Record<string, unknown> = { ...payload };
  if (!body.institute) delete body.institute; // optional FK — omit rather than send ""
  return request("/submissions/", { method: "POST", body: JSON.stringify(body) });
}

export interface Author {
  id: string;
  full_name: string;
  email: string;
  institution: string;
  order: number;
}

export interface SubmissionFileEntry {
  id: string;
  file: string;
  label: string;
  uploaded_at: string;
}

export interface ReviewAssignment {
  id: string;
  submission: string;
  submission_title: string;
  reviewer: string;
  reviewer_name: string;
  decision: string;
  comments_to_author: string;
  comments_to_editor: string;
  assigned_at: string;
  completed_at: string | null;
  due_date: string | null;
}

export interface SubmissionDetail {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  submission_type: string;
  status: string;
  corresponding_author: string;
  corresponding_author_name: string;
  institute: string | null;
  research_area: string;
  sdgs: string[];
  au_agenda_areas: string[];
  references: string;
  doi: string | null;
  authors: Author[];
  files: SubmissionFileEntry[];
  review_assignments: ReviewAssignment[];
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export function getSubmission(id: string) {
  return request<SubmissionDetail>(`/submissions/${id}/`);
}

export function updateSubmission(id: string, payload: Partial<{
  title: string;
  abstract: string;
  keywords: string[];
  submission_type: string;
  institute: string | null;
  research_area: string;
  sdgs: string[];
  au_agenda_areas: string[];
  references: string;
}>) {
  const body: Record<string, unknown> = { ...payload };
  if (!body.institute) delete body.institute;
  return request<SubmissionDetail>(`/submissions/${id}/`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteSubmission(id: string) {
  return request<void>(`/submissions/${id}/`, { method: "DELETE" });
}

export function submitForReview(id: string) {
  return request(`/submissions/${id}/submit/`, { method: "POST" });
}

// --- Co-authors -----------------------------------------------------------

export function addAuthor(submissionId: string, payload: { full_name: string; email?: string; institution?: string }) {
  return request<Author>(`/submissions/${submissionId}/authors/`, {
    method: "POST", body: JSON.stringify(payload),
  });
}

export function removeAuthor(submissionId: string, authorId: string) {
  return request<void>(`/submissions/${submissionId}/authors/${authorId}/`, { method: "DELETE" });
}

// --- Files ------------------------------------------------------------------

export function uploadSubmissionFile(submissionId: string, file: File, label: string = "manuscript") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("label", label);
  return request<SubmissionFileEntry>(`/submissions/${submissionId}/files/`, {
    method: "POST", body: formData,
  });
}

export function removeSubmissionFile(submissionId: string, fileId: string) {
  return request<void>(`/submissions/${submissionId}/files/${fileId}/`, { method: "DELETE" });
}

// --- Editor workflow --------------------------------------------------------

export function advanceStatus(submissionId: string, newStatus: string) {
  return request<SubmissionDetail>(`/submissions/${submissionId}/advance_status/`, {
    method: "POST", body: JSON.stringify({ status: newStatus }),
  });
}

export function assignReviewer(submissionId: string, reviewerId: string, dueDate?: string) {
  return request(`/submissions/${submissionId}/assign-reviewer/`, {
    method: "POST", body: JSON.stringify({ reviewer_id: reviewerId, due_date: dueDate || null }),
  });
}

export interface ReviewerOption {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export function getReviewers() {
  return request<ReviewerOption[] | { results: ReviewerOption[] }>("/users/reviewers/");
}

// --- Reviewer workflow --------------------------------------------------------

export function getMyReviews() {
  return request<{ results: ReviewAssignment[] } | ReviewAssignment[]>("/submissions/reviews/mine/");
}

export function submitReviewDecision(reviewId: string, payload: {
  decision: string;
  comments_to_author?: string;
  comments_to_editor?: string;
}) {
  return request<ReviewAssignment>(`/submissions/reviews/mine/${reviewId}/`, {
    method: "PATCH", body: JSON.stringify(payload),
  });
}

export interface SearchResult {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  institute: string;
  sdgs: string[];
  au_agenda_areas: string[];
  year: number;
}

export function searchRepository(query: string, filters: Record<string, string> = {}) {
  const params = new URLSearchParams({ q: query, ...filters });
  return request<{ count: number; results: SearchResult[] }>(`/repository/search/?${params}`);
}

export interface Me {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  institute: Institute | null;
  student_staff_id: string;
  country: string;
  is_orcid_verified: boolean;
  orcid_id: string | null;
  is_role_manager: boolean;
  profile: {
    id: string; faculty: string; department: string; programme: string;
    biography: string; research_interests: string[]; google_scholar_url: string;
    linkedin_url: string; cv_file: string | null; profile_image: string | null; updated_at: string;
  } | null;
}

export function getMe() {
  return request<Me>("/users/me/");
}

export function updateMe(payload: Partial<{
  first_name: string;
  last_name: string;
  institute: string | null;
  student_staff_id: string;
  country: string;
  orcid_id: string;
}>) {
  const body: Record<string, unknown> = { ...payload };
  if (!body.institute) delete body.institute; // optional FK — omit rather than send ""
  return request("/users/me/", { method: "PATCH", body: JSON.stringify(body) });
}

export function updateAcademicProfile(profileId: string, payload: Partial<{
  faculty: string;
  department: string;
  programme: string;
  biography: string;
  research_interests: string[];
  google_scholar_url: string;
  linkedin_url: string;
}>) {
  return request(`/users/profiles/${profileId}/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export function uploadProfileFile(profileId: string, field: "profile_image" | "cv_file", file: File) {
  const formData = new FormData();
  formData.append(field, file);
  return request(`/users/profiles/${profileId}/`, { method: "PATCH", body: formData });
}


// --- Role management (role-manager / superuser only) ---------------------

export interface ManagedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  institute: Institute | null;
  date_joined: string;
}

export function listManagedUsers(q: string = "") {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  return request<ManagedUser[] | { results: ManagedUser[] }>(`/users/manage/${params}`);
}

export function updateUserRole(id: string, role: string) {
  return request<ManagedUser>(`/users/manage/${id}/role/`, {
    method: "PATCH", body: JSON.stringify({ role }),
  });
}

export function createUserWithRole(payload: {
  email: string; username: string; password: string;
  first_name: string; last_name: string; role: string; institute?: string | null;
}) {
  const body: Record<string, unknown> = { ...payload };
  if (!body.institute) delete body.institute;
  return request<ManagedUser>("/users/manage/create/", { method: "POST", body: JSON.stringify(body) });
}

// CSV export needs the auth header, so a plain <a href> download won't
// work (no way to attach Authorization to a browser navigation) — fetch
// it with auth, then trigger the download from the resulting blob.
export async function downloadUsersCsv() {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE}/users/manage/export/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pau_users_roles.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}