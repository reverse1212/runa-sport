-- AlterTable
ALTER TABLE "Category" ADD COLUMN "imageStorageKey" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "onSale" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "sizeLabel" TEXT,
    "colorName" TEXT,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "priceDelta" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProductRelated" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_sizeLabel_colorName_key" ON "ProductVariant"("productId", "sizeLabel", "colorName");

-- CreateIndex
CREATE UNIQUE INDEX "_ProductRelated_AB_unique" ON "_ProductRelated"("A", "B");

-- CreateIndex
CREATE INDEX "_ProductRelated_B_index" ON "_ProductRelated"("B");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductRelated" ADD CONSTRAINT "_ProductRelated_A_fkey" FOREIGN KEY ("A") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductRelated" ADD CONSTRAINT "_ProductRelated_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
