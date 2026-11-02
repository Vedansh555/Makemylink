import type { Profile } from "@/lib/types";
import type { PlanId } from "@/lib/plans";
import { BioPage } from "../bio/BioPage";

const W = 390;
const H = 800;

/** A phone mockup that renders a real, live bio page at a reduced scale. */
export function PhoneFrame({ profile, scale = 0.62, className = "", plan }: { profile: Profile; scale?: number; className?: string; plan?: PlanId }) {
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: W * scale, height: H * scale }}>
      <div
        className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-[56px] border-[11px] border-[#16161a] bg-[#16161a] shadow-[0_40px_120px_-30px_rgba(0,0,0,.8),inset_0_0_0_1px_rgba(255,255,255,.08)]"
        style={{ width: W, height: H, transform: `scale(${scale})` }}
      >
        <div className="absolute left-1/2 top-3 z-30 h-[26px] w-[110px] -translate-x-1/2 rounded-full bg-black" />
        <div className="no-scrollbar h-full w-full overflow-y-auto overflow-x-hidden rounded-[45px]">
          <BioPage profile={profile} embedded plan={plan} />
        </div>
      </div>
    </div>
  );
}
