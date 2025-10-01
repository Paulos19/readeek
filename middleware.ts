// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  // Obtém o token do utilizador a partir do pedido
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Lista de rotas de autenticação
  const authRoutes = ['/login', '/register'];
  // Lista de rotas protegidas
  const protectedRoutes = ['/dashboard', '/read'];

  // 1. Lógica para utilizadores JÁ AUTENTICADOS
  if (token) {
    // Se o utilizador autenticado tentar aceder a uma rota de autenticação,
    // redireciona-o para o dashboard.
    if (authRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // --- PREPARAÇÃO PARA O DASHBOARD ADMIN ---
    // Se a rota for para o dashboard de administrador...
    if (pathname.startsWith('/admin')) {
      // ...e o papel do utilizador não for 'ADMIN', redireciona-o.
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  // 2. Lógica para utilizadores NÃO AUTENTICADOS
  if (!token) {
    // Se o utilizador não autenticado tentar aceder a uma rota protegida,
    // redireciona-o para a página de login.
    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Se nenhuma das condições acima for satisfeita, permite que o pedido continue.
  return NextResponse.next();
}

// Configuração do Matcher: Define em que rotas o middleware será executado.
// Isto evita que o middleware seja executado em pedidos desnecessários (ex: ficheiros de imagem, CSS).
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/read/:path*',
    '/login',
    '/register',
    // '/admin/:path*', // Adicione esta linha quando criar as rotas de admin
  ],
};