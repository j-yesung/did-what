import axios from "axios";

/**
 * 앱 자신의 Route Handler를 부르는 클라이언트.
 * 외부 API 키가 필요한 요청은 브라우저에서 직접 부르지 않고 이 경로를 거친다.
 * interceptor는 실제 공통 요구가 생길 때 추가한다.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10_000,
});
