package com.example.generic_shop.util;

public class UnitConverter {

    /**
     * Chuyển đổi định lượng công thức (recipeQuantity, recipeUnit) sang đơn vị của nguyên liệu (ingredientUnit).
     * Ví dụ:
     * - 25.0 g Cà phê -> 0.025 kg (nguyên liệu lưu theo kg)
     * - 80.0 ml Sữa tươi -> 0.08 chai (nguyên liệu lưu theo chai 1000ml / 1 Lít)
     * - 15.0 ml Đường nước -> 0.015 chai
     * - 50.0 g Trân châu -> 0.05 kg
     */
    public static double convertToIngredientUnit(double recipeQuantity, String recipeUnit, String ingredientUnit) {
        if (recipeQuantity <= 0) return 0.0;
        if (recipeUnit == null || ingredientUnit == null || recipeUnit.trim().equalsIgnoreCase(ingredientUnit.trim())) {
            return recipeQuantity;
        }

        String rUnit = recipeUnit.trim().toLowerCase();
        String iUnit = ingredientUnit.trim().toLowerCase();

        // 1. Gram (g) <-> Kilogram (kg)
        if (rUnit.equals("g") && iUnit.equals("kg")) {
            return recipeQuantity / 1000.0;
        }
        if (rUnit.equals("kg") && iUnit.equals("g")) {
            return recipeQuantity * 1000.0;
        }

        // 2. Milliliter (ml) <-> Liter (l)
        if (rUnit.equals("ml") && (iUnit.equals("l") || iUnit.equals("lit") || iUnit.equals("lít"))) {
            return recipeQuantity / 1000.0;
        }
        if ((rUnit.equals("l") || rUnit.equals("lit") || rUnit.equals("lít")) && iUnit.equals("ml")) {
            return recipeQuantity * 1000.0;
        }

        // 3. ml / g -> chai / hộp / lon / gói (Thường quy ước 1 chai/hộp/lon chuẩn = 1000ml hoặc 1000g)
        if ((rUnit.equals("ml") || rUnit.equals("g")) && (iUnit.equals("chai") || iUnit.equals("hộp") || iUnit.equals("lon") || iUnit.equals("gói") || iUnit.equals("kg") || iUnit.equals("l"))) {
            return recipeQuantity / 1000.0;
        }

        // 4. Nếu recipeQuantity > 1.0 và đơn vị nguyên liệu là kg / chai / l mà recipeUnit chưa xác định, tự động quy đổi theo tỷ lệ 1/1000
        if (recipeQuantity >= 1.0 && (iUnit.equals("kg") || iUnit.equals("chai") || iUnit.equals("l"))) {
            return recipeQuantity / 1000.0;
        }

        return recipeQuantity;
    }

    public static double roundQuantity(double val) {
        return Math.round(val * 10000.0) / 10000.0;
    }

    /**
     * Format hiển thị số lượng nguyên liệu kèm đơn vị thân thiện
     */
    public static String formatQuantityWithUnit(double qty, String unit) {
        double rQty = roundQuantity(qty);
        if (rQty == (long) rQty) {
            return String.format("%d %s", (long) rQty, unit);
        }
        return String.format("%.3f %s", rQty, unit).replaceAll("0+$", "").replaceAll("\\.$", "") + " " + unit;
    }
}
