import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Creates a Supabase client suitable for middleware – reads/writes
 * cookies on the NextResponse object so the session stays fresh.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/coordinator") ||
    pathname.startsWith("/companyDetails") ||
    pathname.startsWith("/superadmin");

  if (!user) {
    if (isProtectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  const role = profile?.role as string | undefined;

  // A deactivated coordinator is locked out entirely: sign them out and bounce
  // to the login page with a notice. Runs on every request, so existing
  // sessions are killed on their next navigation.
  if (role === "coordinator" && profile?.is_active === false) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?deactivated=1";
    return NextResponse.redirect(url);
  }

  if (!role) {
    if (pathname === "/login" || pathname === "/register") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (pathname.startsWith("/coordinator")) {
    if (role !== "coordinator") {
      const url = request.nextUrl.clone();
      url.pathname = role === "superadmin" ? "/superadmin" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/superadmin")) {
    if (role !== "superadmin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "coordinator" ? "/coordinator" : "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/dashboard") && role !== "student") {
    const url = request.nextUrl.clone();
    url.pathname = role === "superadmin" ? "/superadmin" : "/coordinator";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" || pathname === "/register") {
    const url = request.nextUrl.clone();
    url.pathname =
      role === "superadmin"
        ? "/superadmin"
        : role === "coordinator"
          ? "/coordinator"
          : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
