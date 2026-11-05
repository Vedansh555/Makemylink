import type { Importer } from "./types";
import { biosite } from "./biosite";
import { campsite } from "./campsite";
import { carrd } from "./carrd";
import { generic } from "./generic";
import { hoobe } from "./hoobe";
import { instabio, instabioLinksUrl } from "./instabio";
import { linkinbio } from "./linkinbio";
import { linktree } from "./linktree";
import { milkshake } from "./milkshake";
import { solo } from "./solo";
import { taplink } from "./taplink";

export { generic };

/** Platform importers, tried in order. Anything no platform recognises goes to the generic reader. */
export const importers: Importer[] = [linktree, campsite, taplink, carrd, solo, hoobe, milkshake, biosite, { ...instabio, followUp: instabioLinksUrl }, linkinbio];

/** Names of the platforms we read specially, for the interface to show. */
export const supportedPlatforms = importers.map((i) => i.label);
