export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  roles: string[];
}
