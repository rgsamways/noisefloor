import type { FastifyInstance, FastifyReply } from "fastify";
import { requireGroupRule } from "../lib/group-authorization.js";
import { toUispDeviceDetail } from "../lib/uisp-device-detail.js";
import { fetchUispDevice, UispUnavailableError, type UispDevice } from "../lib/uisp-client.js";

// Mirrors genieacs.ts's fetchDeviceOrRespond exactly — same not-found vs
// unreachable distinction (design.md's decision), same guard-return
// convention.
async function fetchDeviceOrRespond(deviceId: string, reply: FastifyReply): Promise<UispDevice | undefined> {
  let device: UispDevice | null;
  try {
    device = await fetchUispDevice(deviceId);
  } catch (error) {
    if (error instanceof UispUnavailableError) {
      reply.status(502).send({ error: "uisp unavailable" });
      return undefined;
    }
    throw error;
  }

  if (!device) {
    reply.status(404).send({ error: "device not found" });
    return undefined;
  }

  return device;
}

// Gated by the same view_device_status rule GenieACS uses, not a new
// view_radio_status rule (design.md's decision).
export async function uispRoute(app: FastifyInstance) {
  app.get<{ Params: { deviceId: string } }>(
    "/api/uisp/devices/:deviceId",
    { preHandler: requireGroupRule("view_device_status") },
    async (request, reply) => {
      const device = await fetchDeviceOrRespond(request.params.deviceId, reply);
      if (!device) return;

      return toUispDeviceDetail(device);
    },
  );
}
