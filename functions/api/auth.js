// Cloudflare Pages Function for Authentication
// This is a simple demo auth system - in production, use proper authentication!

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { username, password } = body;

    // Simple hardcoded auth for demo purposes
    // In production: use proper authentication with hashing, JWT, etc.
    if (username === 'admin' && password === 'admin') {
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            username: 'admin',
            level: 7,
            xp: 1250,
            streak: 12
          },
          message: 'Login erfolgreich!'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            // In production: set secure session cookies or JWT tokens
            'Set-Cookie': 'auth_session=demo_session; HttpOnly; Secure; SameSite=Strict; Max-Age=86400'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Ungültiger Benutzername oder Passwort'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Server-Fehler'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function onRequestGet(context) {
  return new Response(
    JSON.stringify({
      message: 'Auth endpoint - use POST to login'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
