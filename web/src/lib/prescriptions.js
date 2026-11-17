import "server-only";
import { normalizePower } from "./format";
import { Customer, Prescription } from "@/models";

const cleanEye = (e = {}) => ({
  dp: { sph: normalizePower(e.dp?.sph), cyl: normalizePower(e.dp?.cyl), axis: e.dp?.axis || "", va: e.dp?.va || "" },
  np: { sph: normalizePower(e.np?.sph), cyl: normalizePower(e.np?.cyl), axis: e.np?.axis || "", va: e.np?.va || "" },
  add: normalizePower(e.add),
  pd: e.pd || "",
});

export async function createPrescriptionRecord(customerId, rx, storeId, session) {
  const visitNo = (await Prescription.countDocuments({ customerId }).session(session ?? null)) + 1;
  const [doc] = await Prescription.create(
    [
      {
        customerId,
        storeId,
        visitNo,
        visitDate: new Date(),
        type: rx.type || "spectacle",
        right: cleanEye(rx.right),
        left: cleanEye(rx.left),
        vertexDistance: rx.vertexDistance,
        refractiveIndex: rx.refractiveIndex,
        fittingHeight: rx.fittingHeight,
        lens: rx.lens,
        shade: rx.shade,
        frame: rx.frame,
        usage: rx.usage || [],
        examinedBy: rx.examinedBy,
        notes: rx.notes,
      },
    ],
    { session }
  );
  await Customer.updateOne({ _id: customerId }, { $set: { lastVisitAt: new Date() } }, { session });
  return doc;
}

