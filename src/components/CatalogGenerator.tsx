"use client";

import React, { useState } from "react";
import { 
  FileText, 
  X, 
  Download, 
  Settings, 
  Layout, 
  Check,
  Loader2,
  Trash2,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProductSelection } from "@/src/context/ProductSelectionContext";
import { cn } from "@/src/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";
import toast from "react-hot-toast";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const TEMPLATES: Template[] = [
  { 
    id: "modern", 
    name: "Modern Minimal", 
    description: "Clean layout with large images and bold typography.",
    icon: <Layout className="h-5 w-5" />
  },
  { 
    id: "grid", 
    name: "Product Grid", 
    description: "Efficient grid view for displaying many products per page.",
    icon: <LayoutGrid className="h-5 w-5" />
  },
  { 
    id: "list", 
    name: "Technical List", 
    description: "Detailed list view optimized for specifications and IDs.",
    icon: <FileText className="h-5 w-5" />
  }
];

function LayoutGrid(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

export default function CatalogGenerator() {
  const { selectedProducts, clearSelection, toggleProduct } = useProductSelection();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [catalogTitle, setCatalogTitle] = useState("Product Catalog");

  const generatePDF = async () => {
    if (selectedProducts.length === 0) return;
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Header
      doc.setFillColor(59, 130, 246); // Primary blue
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(catalogTitle, 20, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 33);
      doc.text(`${selectedProducts.length} Products`, pageWidth - 20, 33, { align: "right" });

      let yPos = 55;

      if (selectedTemplate === "list") {
        const tableData = selectedProducts.map(p => [
          p.unique_product_id,
          p.name,
          [p.location_1, p.location_2].filter(Boolean).join(", "),
          p.description ? p.description.substring(0, 50) + "..." : "N/A"
        ]);

        (doc as any).autoTable({
          startY: yPos,
          head: [['ID', 'Product Name', 'Location', 'Description']],
          body: tableData,
          headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: 50 },
          styles: { fontSize: 9, cellPadding: 5 }
        });
      } else if (selectedTemplate === "grid") {
        const itemsPerRow = 2;
        const itemWidth = (pageWidth - 60) / itemsPerRow;
        const itemHeight = 80;
        
        selectedProducts.forEach((product, index) => {
          const row = Math.floor(index / itemsPerRow);
          const col = index % itemsPerRow;
          
          const x = 20 + col * (itemWidth + 20);
          const y = yPos + row * (itemHeight + 15);
          
          // Check for new page
          if (y + itemHeight > pageHeight - 20) {
            doc.addPage();
            yPos = 20 - row * (itemHeight + 15); // Reset yPos relative to the new page
          }

          // Card Background
          doc.setDrawColor(230, 230, 230);
          doc.roundedRect(x, y, itemWidth, itemHeight, 3, 3, 'S');
          
          // Text
          doc.setTextColor(30, 30, 30);
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(product.name.substring(0, 25), x + 5, y + 15);
          
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(`ID: ${product.unique_product_id}`, x + 5, y + 22);
          
          if (product.description) {
            const splitDesc = doc.splitTextToSize(product.description, itemWidth - 10);
            doc.text(splitDesc.slice(0, 3), x + 5, y + 30);
          }
          
          const location = [product.location_1, product.location_2].filter(Boolean).join(", ");
          if (location) {
            doc.text(location.substring(0, 30), x + 5, y + itemHeight - 8);
          }
        });
      } else {
        // Modern Minimal (1 per row)
        selectedProducts.forEach((product, index) => {
          if (index > 0) doc.addPage();
          
          const x = 20;
          let y = 30;
          
          doc.setTextColor(59, 130, 246);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("PRODUCT DETAILS", x, y);
          
          y += 10;
          doc.setTextColor(30, 30, 30);
          doc.setFontSize(28);
          doc.text(product.name, x, y);
          
          y += 15;
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text(`SKU: ${product.unique_product_id}`, x, y);
          
          y += 20;
          doc.setDrawColor(240, 240, 240);
          doc.line(x, y, pageWidth - 20, y);
          
          y += 15;
          doc.setTextColor(80, 80, 80);
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Description", x, y);
          
          y += 10;
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          if (product.description) {
            const splitDesc = doc.splitTextToSize(product.description, pageWidth - 40);
            doc.text(splitDesc, x, y);
            y += splitDesc.length * 6;
          } else {
            doc.text("No description provided.", x, y);
            y += 10;
          }
          
          y += 15;
          const location = [product.location_1, product.location_2].filter(Boolean).join(", ");
          if (location) {
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Location", x, y);
            
            y += 10;
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            doc.text(location, x, y);
          }
          
          // Footer
          doc.setFontSize(8);
          doc.setTextColor(180, 180, 180);
          doc.text(`Catalog Manager | ${catalogTitle} | Page ${index + 1}`, pageWidth / 2, pageHeight - 10, { align: "center" });
        });
      }

      doc.save(`${catalogTitle.replace(/\s+/g, '_')}.pdf`);
      toast.success("Catalog generated successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (selectedProducts.length === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating Action Bar */}
      <AnimatePresence>
        {selectedProducts.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-6 rounded-3xl border bg-background/80 p-4 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center gap-4 border-r pr-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <PackageIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground">
                  {selectedProducts.length} Products Selected
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Ready for PDF Catalog
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-95"
              >
                <FileText className="h-5 w-5" />
                Generate PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b bg-muted/30 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Settings className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-foreground">
                    Catalog Designer
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Catalog Title
                  </label>
                  <input
                    type="text"
                    value={catalogTitle}
                    onChange={(e) => setCatalogTitle(e.target.value)}
                    placeholder="e.g., Summer Collection 2024"
                    className="w-full rounded-2xl border bg-background px-5 py-4 text-sm font-bold transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Choose Template
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={cn(
                          "relative flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all",
                          selectedTemplate === template.id 
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
                            : "border-border bg-background hover:border-primary/30"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                          selectedTemplate === template.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          {template.icon}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{template.name}</p>
                          <p className="mt-1 text-[10px] font-medium leading-relaxed text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="absolute top-4 right-4 text-primary">
                            <Check className="h-4 w-4 stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Products in Catalog ({selectedProducts.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedProducts.map((p) => (
                      <div 
                        key={p.id}
                        className="flex items-center gap-2 rounded-full border bg-muted/30 pl-3 pr-1 py-1"
                      >
                        <span className="text-[10px] font-bold text-foreground">{p.name}</span>
                        <button 
                          onClick={() => toggleProduct(p)}
                          className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t bg-muted/30 p-8">
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-2xl bg-secondary px-6 py-4 text-sm font-bold text-secondary-foreground transition-all hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  onClick={generatePDF}
                  disabled={isGenerating || selectedProducts.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function PackageIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
