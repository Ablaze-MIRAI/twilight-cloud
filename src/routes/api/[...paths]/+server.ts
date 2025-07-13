import type { RequestHandler } from "@sveltejs/kit";

import { apiController } from "./controller";

export const GET: RequestHandler = ({ request }) => apiController.fetch(request);
export const POST: RequestHandler = ({ request }) => apiController.fetch(request);
export const PUT: RequestHandler = ({ request }) => apiController.fetch(request);
export const DELETE: RequestHandler = ({ request }) => apiController.fetch(request);