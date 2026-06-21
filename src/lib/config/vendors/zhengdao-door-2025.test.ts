import assert from "node:assert/strict";
import {
  ZHENGDAO_DOOR_CATALOG_CATEGORIES,
  ZHENGDAO_FLAT_DOORS,
  groupZhengdaoFlatDoorOptions,
  resolveZhengdaoDoorSelection,
} from "./zhengdao-door-2025";
import type { ZhengdaoDoorSelection } from "@/types";

const flat = resolveZhengdaoDoorSelection({ mode: "FLAT", optionCode: "ER" });
assert.equal(flat?.materialRef.pricePerUnit, 170);
assert.equal(flat?.materialRef.minCai, 1);

const flat25Abs = resolveZhengdaoDoorSelection({ mode: "FLAT", optionCode: "ER-25-ABS" });
assert.equal(flat25Abs?.materialRef.pricePerUnit, 220);
assert.equal(flat25Abs?.materialRef.minCai, 2);
assert.equal(flat25Abs?.materialRef.materialName, "ER 平板門板 25mm 封ABS（門板 / 櫃面）");
assert.equal(flat25Abs?.note, "25mm 封ABS，門板 / 櫃面用，基本才 2 才");

const flat50Abs = resolveZhengdaoDoorSelection({ mode: "FLAT", optionCode: "MR-50-ABS" });
assert.equal(flat50Abs?.materialRef.pricePerUnit, 800);
assert.equal(flat50Abs?.materialRef.minCai, 3);

const flatGroups = groupZhengdaoFlatDoorOptions(ZHENGDAO_FLAT_DOORS);
const erFlatGroup = flatGroups.find((group) => group.series === "ER");
assert.deepEqual(erFlatGroup?.options.map((option) => option.code), ["ER", "ER-25-PVC", "ER-25-ABS", "ER-50-ABS"]);
assert.deepEqual(
  flatGroups.find((group) => group.series === "PR")?.options.map((option) => option.code),
  ["PR"],
);

assert.equal(ZHENGDAO_DOOR_CATALOG_CATEGORIES.length, 20);
assert.equal(ZHENGDAO_DOOR_CATALOG_CATEGORIES.some((category) => category.label.includes("造型門板")), false);
assert.equal(ZHENGDAO_DOOR_CATALOG_CATEGORIES.some((category) => category.label.includes("手工門板")), false);
assert.equal(ZHENGDAO_DOOR_CATALOG_CATEGORIES.every((category) => category.options.length > 0 || (category.tieredOptions?.length ?? 0) > 0), true);
assert.equal(ZHENGDAO_DOOR_CATALOG_CATEGORIES.find((category) => category.code === "GD_GRILLE")?.tieredOptions?.[0]?.code, "GD-GRILLE");
assert.equal(ZHENGDAO_DOOR_CATALOG_CATEGORIES.find((category) => category.code === "LOUVER")?.tieredOptions?.length, 2);

const louverBase = resolveZhengdaoDoorSelection({ mode: "FINISHED", optionCode: "BY-LOUVER" });
assert.equal(louverBase?.materialRef.materialName, "BY 百葉門板（JM / ER） 18mm");
assert.equal(louverBase?.materialRef.pricePerUnit, 1200);
assert.equal(louverBase?.materialRef.minCai, 4);

const louverMr = resolveZhengdaoDoorSelection({ mode: "FINISHED", optionCode: "BY-DOUBLE-LOUVER", materialTier: "MR" });
assert.equal(louverMr?.materialRef.materialName, "BY 雙區百葉門板（MR） 18mm");
assert.equal(louverMr?.materialRef.pricePerUnit, 1400);
assert.equal(louverMr?.materialRef.minCai, 4);

const roundLouverAr = resolveZhengdaoDoorSelection({ mode: "FINISHED", optionCode: "ROUND-BY-LOUVER", materialTier: "AR" });
assert.equal(roundLouverAr?.materialRef.pricePerUnit, 1650);
assert.equal(roundLouverAr?.materialRef.minCai, 4);

const vintageDouble = resolveZhengdaoDoorSelection({ mode: "FINISHED", optionCode: "DOUBLE-VINTAGE-FRAME" });
assert.equal(vintageDouble?.materialRef.pricePerUnit, 900);
assert.equal(vintageDouble?.materialRef.minCai, 5);

const rattanPr = resolveZhengdaoDoorSelection({ mode: "FINISHED", optionCode: "ROUND-RATTAN", materialTier: "PR" });
assert.equal(rattanPr?.materialRef.pricePerUnit, 2600);
assert.equal(rattanPr?.materialRef.minCai, 3);

const gdMr = resolveZhengdaoDoorSelection({ mode: "FINISHED", optionCode: "GD-GRILLE", materialTier: "MR" });
assert.equal(gdMr?.materialRef.pricePerUnit, 1400);
assert.equal(gdMr?.materialRef.minCai, 3);

const shaped = resolveZhengdaoDoorSelection({ mode: "SHAPED", baseCode: "AR", optionCode: "JU" });
assert.equal(shaped?.materialRef.pricePerUnit, 490);
assert.equal(shaped?.materialRef.minCai, 2);
assert.equal(resolveZhengdaoDoorSelection({ mode: "SHAPED", baseCode: "MR", optionCode: "JU" }), null);

const legacyAluminumFrame = { mode: "ALUMINUM_FRAME", frameColor: "BLACK" } as unknown as ZhengdaoDoorSelection;
assert.equal(resolveZhengdaoDoorSelection(legacyAluminumFrame), null);

assert.equal(resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "HB-BLACK" }), null);

assert.equal(resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "H8-BUFFER" }), null);

const h8PartitionDoor = resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "H8-ALUMINUM" });
assert.equal(h8PartitionDoor?.materialRef.materialName, "H8 鋁框懸吊門（鋁色） 20mm");
assert.equal(h8PartitionDoor?.materialRef.pricePerUnit, 600);
assert.equal(h8PartitionDoor?.materialRef.minCai, 10);

const h8BlackPartitionDoor = resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "H8-BLACK" });
assert.equal(h8BlackPartitionDoor?.materialRef.materialName, "H8 鋁框懸吊門（黑色） 20mm");
assert.equal(h8BlackPartitionDoor?.materialRef.pricePerUnit, 650);
assert.equal(h8BlackPartitionDoor?.materialRef.minCai, 10);

const h8WhitePartitionDoor = resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "H8-WHITE" });
assert.equal(h8WhitePartitionDoor?.materialRef.materialName, "H8 鋁框懸吊門（白色） 20mm");
assert.equal(h8WhitePartitionDoor?.materialRef.pricePerUnit, 650);
assert.equal(h8WhitePartitionDoor?.materialRef.minCai, 10);

const s2PartitionDoor = resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "S2-ALUMINUM" });
assert.equal(s2PartitionDoor?.materialRef.materialName, "S2 鋁框落地推拉門（鋁色） 20mm");
assert.equal(s2PartitionDoor?.materialRef.pricePerUnit, 550);
assert.equal(s2PartitionDoor?.materialRef.minCai, 10);

const s2WhitePartitionDoor = resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "S2-WHITE" });
assert.equal(s2WhitePartitionDoor?.materialRef.materialName, "S2 鋁框落地推拉門（白色） 20mm");
assert.equal(s2WhitePartitionDoor?.materialRef.pricePerUnit, 580);
assert.equal(s2WhitePartitionDoor?.materialRef.minCai, 10);

assert.equal(resolveZhengdaoDoorSelection({ mode: "FINISHED", optionCode: "BGD" }), null);
const bgdPartitionDoor = resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "BGD" });
assert.equal(bgdPartitionDoor?.materialRef.materialName, "BGD 隔柵透氣門 18mm");
assert.equal(bgdPartitionDoor?.materialRef.pricePerUnit, 1000);
assert.equal(bgdPartitionDoor?.materialRef.minCai, 3);

const gwPartitionDoor = resolveZhengdaoDoorSelection({ mode: "PARTITION_DOOR", optionCode: "GW" });
assert.equal(gwPartitionDoor?.materialRef.materialName, "GW 格柵壁板／天花板 18mm");
assert.equal(gwPartitionDoor?.materialRef.pricePerUnit, 1200);
assert.equal(gwPartitionDoor?.materialRef.minCai, 3);

const gdDoor = resolveZhengdaoDoorSelection({ mode: "FINISHED", optionCode: "GD-GRILLE" });
assert.equal(gdDoor?.materialRef.materialName, "GD 格柵門板（JM / ER） 18mm");
assert.equal(gdDoor?.materialRef.pricePerUnit, 1200);
assert.equal(gdDoor?.materialRef.minCai, 3);

console.log("Zhengdao door catalog tests passed");
