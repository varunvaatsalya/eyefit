import { MapPin, Phone, Navigation, Clock } from "lucide-react";
import { WhatsAppIcon } from "@/components/whatsapp/whatsapp-icon";

export function StoreCard({ store: s }) {
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} ${s.address}`)}`;
  return (
    <div className="flex flex-col rounded-3xl bg-card p-6 ring-1 ring-foreground/5">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MapPin className="size-5" /></span>
      <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{s.address}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Clock className="size-3.5" /> 10 AM to 9 PM, all days</p>
      <div className="mt-5 grid grid-cols-3 gap-2 pt-1">
        <a href={`tel:${s.phone}`} className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 py-2 text-xs font-medium transition hover:bg-muted"><Phone className="size-4" /> Call</a>
        <a href={`https://wa.me/91${s.phone}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 py-2 text-xs font-medium text-[#128C7E] transition hover:bg-muted"><WhatsAppIcon className="size-4" /> WhatsApp</a>
        <a href={maps} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 py-2 text-xs font-medium transition hover:bg-muted"><Navigation className="size-4" /> Directions</a>
      </div>
    </div>
  );
}
