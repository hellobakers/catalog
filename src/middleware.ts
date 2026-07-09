import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionEdge } from "./lib/session-edge";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const publicPaths = ["/login"];
  const isPublicPath = publicPaths.includes(path);

  const token = request.cookies.get("auth_token")?.value;

  if (!isPublicPath && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (token && !isPublicPath) {
    const session = await verifySessionEdge(token);
    if (!session) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  if (isPublicPath && token) {
    const session = await verifySessionEdge(token);
    if (session) {
      return NextResponse.redirect(new URL("/browse", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/add-product",
    "/products/:path*",
    "/categories/:path*",
    "/browse/:path*",
  ],
};
