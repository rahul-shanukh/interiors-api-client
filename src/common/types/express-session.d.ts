// This declaration file extends Express's Request type to tell TypeScript
// what structure your session data has. Without this, TypeScript won't know
// what properties are available on req.session.user
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      userId: string; // The user's unique ID from the user collection
      employeeId: string; // The employee ID this user is linked to
      role: string; // The user's role (IT, HR, MANAGER, etc.)
      name: string; // The employee's full name (for convenience)
    };
  }
}
