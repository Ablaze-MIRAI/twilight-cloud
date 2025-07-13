import type { RequestHandler } from "@sveltejs/kit";

import { authController } from "./controller";

export const GET: RequestHandler = ({ request }) => authController.fetch(request);
export const POST: RequestHandler = ({ request }) => authController.fetch(request);
export const PUT: RequestHandler = ({ request }) => authController.fetch(request);
export const DELETE: RequestHandler = ({ request }) => authController.fetch(request);