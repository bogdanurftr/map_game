/**
 * Curated core-4 resource node locations approximating the real-world
 * resource map (SPEC §5). Coordinates are [lon, lat] near real deposits;
 * amounts are the SPEC §5 ⚙ defaults applied by the build script.
 */

export type ResourceKind = "iron" | "oil" | "copper" | "gold";

export interface ResourceNodeSeed {
  kind: ResourceKind;
  lon: number;
  lat: number;
  label: string;
}

export const RESOURCE_SEEDS: ResourceNodeSeed[] = [
  // — Iron (major ore provinces)
  { kind: "iron", lon: 119.7, lat: -22.6, label: "Pilbara, Australia" },
  { kind: "iron", lon: -50.2, lat: -6.1, label: "Carajás, Brazil" },
  { kind: "iron", lon: -43.5, lat: -19.9, label: "Minas Gerais, Brazil" },
  { kind: "iron", lon: 114.5, lat: 36.6, label: "Hebei, China" },
  { kind: "iron", lon: 123.0, lat: 41.1, label: "Anshan, China" },
  { kind: "iron", lon: 85.0, lat: 21.5, label: "Odisha, India" },
  { kind: "iron", lon: 36.6, lat: 51.7, label: "Kursk, Russia" },
  { kind: "iron", lon: 33.4, lat: 47.9, label: "Kryvyi Rih, Ukraine" },
  { kind: "iron", lon: 20.2, lat: 67.9, label: "Kiruna, Sweden" },
  { kind: "iron", lon: -92.5, lat: 47.5, label: "Mesabi Range, USA" },
  { kind: "iron", lon: 27.8, lat: -23.7, label: "Limpopo, South Africa" },
  { kind: "iron", lon: -12.7, lat: 22.7, label: "Zouérat, Mauritania" },
  { kind: "iron", lon: 7.3, lat: 5.5, label: "Itakpe, Nigeria" },
  { kind: "iron", lon: 59.9, lat: 57.9, label: "Urals, Russia" },

  // — Oil (petroleum provinces)
  { kind: "oil", lon: 48.5, lat: 28.0, label: "Persian Gulf (Kuwait/Saudi)" },
  { kind: "oil", lon: 51.0, lat: 25.5, label: "Qatar / UAE" },
  { kind: "oil", lon: 47.8, lat: 30.5, label: "Basra, Iraq" },
  { kind: "oil", lon: 49.6, lat: 31.3, label: "Khuzestan, Iran" },
  { kind: "oil", lon: 76.0, lat: 61.0, label: "West Siberia, Russia" },
  { kind: "oil", lon: 53.0, lat: 47.0, label: "Caspian (Kazakhstan)" },
  { kind: "oil", lon: -102.0, lat: 31.5, label: "Permian Basin, USA" },
  { kind: "oil", lon: -90.5, lat: 28.5, label: "Gulf of Mexico, USA" },
  { kind: "oil", lon: -111.5, lat: 56.7, label: "Athabasca, Canada" },
  { kind: "oil", lon: -71.3, lat: 10.2, label: "Maracaibo, Venezuela" },
  { kind: "oil", lon: -64.0, lat: 8.5, label: "Orinoco Belt, Venezuela" },
  { kind: "oil", lon: 6.8, lat: 4.8, label: "Niger Delta, Nigeria" },
  { kind: "oil", lon: 17.5, lat: 28.5, label: "Sirte Basin, Libya" },
  { kind: "oil", lon: 6.0, lat: 31.0, label: "Hassi Messaoud, Algeria" },
  { kind: "oil", lon: 1.8, lat: 58.5, label: "North Sea" },
  { kind: "oil", lon: 124.5, lat: 46.6, label: "Daqing, China" },
  { kind: "oil", lon: 101.5, lat: 1.5, label: "Sumatra, Indonesia" },
  { kind: "oil", lon: -42.0, lat: -24.0, label: "Pre-salt, Brazil" },

  // — Copper
  { kind: "copper", lon: -69.1, lat: -24.3, label: "Escondida, Chile" },
  { kind: "copper", lon: -70.3, lat: -22.3, label: "Chuquicamata, Chile" },
  { kind: "copper", lon: -71.6, lat: -14.9, label: "Southern Peru" },
  { kind: "copper", lon: 25.8, lat: -10.7, label: "Copperbelt, DRC" },
  { kind: "copper", lon: 28.2, lat: -12.8, label: "Copperbelt, Zambia" },
  { kind: "copper", lon: -110.8, lat: 32.5, label: "Arizona, USA" },
  { kind: "copper", lon: 137.1, lat: -4.1, label: "Grasberg, Indonesia" },
  { kind: "copper", lon: 141.0, lat: -32.0, label: "NSW, Australia" },
  { kind: "copper", lon: 92.5, lat: 31.0, label: "Tibet, China" },
  { kind: "copper", lon: 106.9, lat: 43.0, label: "Oyu Tolgoi, Mongolia" },
  { kind: "copper", lon: 16.5, lat: 51.4, label: "Lubin, Poland" },
  { kind: "copper", lon: 69.6, lat: 49.9, label: "Kazakhstan" },

  // — Gold
  { kind: "gold", lon: 27.0, lat: -26.4, label: "Witwatersrand, South Africa" },
  { kind: "gold", lon: 121.5, lat: -30.7, label: "Kalgoorlie, Australia" },
  { kind: "gold", lon: -116.5, lat: 40.8, label: "Nevada, USA" },
  { kind: "gold", lon: 120.4, lat: 37.4, label: "Shandong, China" },
  { kind: "gold", lon: 114.0, lat: 62.5, label: "East Siberia, Russia" },
  { kind: "gold", lon: -78.3, lat: -6.9, label: "Yanacocha, Peru" },
  { kind: "gold", lon: -1.8, lat: 6.3, label: "Ashanti, Ghana" },
  { kind: "gold", lon: 64.6, lat: 41.5, label: "Muruntau, Uzbekistan" },
  { kind: "gold", lon: -81.0, lat: 48.5, label: "Ontario, Canada" },
  { kind: "gold", lon: 137.0, lat: -3.9, label: "Papua, Indonesia" },
];
