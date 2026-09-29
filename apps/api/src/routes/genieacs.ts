import type { FastifyReply } from "fastify";
import type { FastifyInstance } from "fastify";
import { toDeviceDetail } from "../lib/genieacs-device-detail.js";
import { computeDeviceStatus } from "../lib/genieacs-device-status.js";
import { fetchGenieAcsDevice, GenieAcsUnavailableError, type GenieAcsDevice } from "../lib/genieacs-client.js";
import { requireGroupRule } from "../lib/group-authorization.js";

// Shared by both routes below: not-found vs unreachable are different
// HTTP statuses (design.md's decision) — a caller needs to tell "this
// device doesn't exist" apart from "GenieACS is down." Returns undefined
// once it has already sent an error response, matching this codebase's
// requireSession-style guard-return convention.
async function fetchDeviceOrRespond(deviceId: string, reply: FastifyReply): Promise<GenieAcsDevice | undefined> {
  let device: GenieAcsDevice | null;
  try {
    device = await fetchGenieAcsDevice(deviceId);
  } catch (error) {
    if (error instanceof GenieAcsUnavailableError) {
      reply.status(502).send({ error: "genieacs unavailable" });
      return undefined;
    }
    throw error;
  }

  if (!device || !device._lastInform) {
    reply.status(404).send({ error: "device not found" });
    return undefined;
  }

  return device;
}

// Checking/rebooting a device is a ticket-handling action for T1/T2
// support, not an admin-only tool — gated by view_device_status rather
// than requireSiteAdmin (moved off the Admin page onto Tickets; see
// add-genieacs-device-status's design.md).
export async function genieacsRoute(app: FastifyInstance) {
  app.get<{ Params: { deviceId: string } }>(
    "/api/genieacs/devices/:deviceId/status",
    { preHandler: requireGroupRule("view_device_status") },
    async (request, reply) => {
      const device = await fetchDeviceOrRespond(request.params.deviceId, reply);
      if (!device) return;

      const periodicInformIntervalSeconds = device.Device?.ManagementServer?.PeriodicInformInterval?._value;
      return computeDeviceStatus(device._lastInform!, periodicInformIntervalSeconds);
    },
  );

  // The full device detail screen — "everything the API provides," not
  // just the status summary above. Curated fields plus the untouched
  // raw record (toDeviceDetail's own doc comment).
  app.get<{ Params: { deviceId: string } }>(
    "/api/genieacs/devices/:deviceId",
    { preHandler: requireGroupRule("view_device_status") },
    async (request, reply) => {
      const device = await fetchDeviceOrRespond(request.params.deviceId, reply);
      if (!device) return;

      return toDeviceDetail(device);
    },
  );
}
