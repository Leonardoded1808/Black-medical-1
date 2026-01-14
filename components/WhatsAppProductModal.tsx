import React, { useState, useEffect } from "react";
import type { Product, Lead, WhatsAppTemplate } from "../types";

interface WhatsAppProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  products: Product[];
  templates: WhatsAppTemplate[];
  onSend: (productId: string, message: string) => void;
}

export const WhatsAppProductModal: React.FC<WhatsAppProductModalProps> = ({
  isOpen,
  onClose,
  lead,
  products,
  templates,
  onSend,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [imageCopied, setImageCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedProductId("");
      setSelectedTemplateId("");
      setMessage("");
      setImageCopied(false);
      setIsCopying(false);
    }
  }, [isOpen]);

  // Function to generate message based on template and product
  const generateMessage = (prodId: string, tempId: string) => {
    const product = products.find((p) => p.id === prodId);
    const template = templates.find((t) => t.id === tempId);

    if (!product) {
      setMessage("");
      return;
    }

    let content = "";

    // Helper seguro para formatear precio
    const formatPrice = (val: any) => {
      const num = Number(val);
      return isNaN(num) ? "0" : num.toLocaleString("es-ES");
    };

    if (template) {
      content = template.content || "";
      // Replace variables safely
      content = content.replace(/{NOMBRE_CLIENTE}/g, lead.name || "Cliente");
      content = content.replace(/{EMPRESA_CLIENTE}/g, lead.company || "");
      content = content.replace(
        /{NOMBRE_PRODUCTO}/g,
        product.name || "Producto",
      );
      content = content.replace(
        /{PRECIO_PRODUCTO}/g,
        formatPrice(product.price),
      );
      content = content.replace(
        /{DESCRIPCION_PRODUCTO}/g,
        product.description || "",
      );
    } else {
      // Default template if none selected
      content = `Hola ${lead.name || "Cliente"}, gusto en saludarte.\n\nTe comparto la información del equipo médico que podría interesarte:\n\n*${product.name || "Producto"}*\n${product.description || ""}\n\n*Precio:* €${formatPrice(product.price)}\n\nQuedo atento a tus dudas.`;
    }

    setMessage(content);
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    generateMessage(productId, selectedTemplateId);
    setImageCopied(false);
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    generateMessage(selectedProductId, templateId);
  };

  const copyImageToClipboard = async () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (product && product.image) {
      setIsCopying(true);
      try {
        const img = new Image();

        // CRUCIAL: Solo establecer crossOrigin si NO es base64 (data:image...)
        // Establecerlo en data URLs puede causar "SecurityError" en algunos navegadores al dibujar en canvas.
        if (!product.image.startsWith("data:")) {
          img.crossOrigin = "anonymous";
        }

        img.src = product.image;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () =>
            reject(new Error("No se pudo cargar la imagen fuente."));
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Error de contexto Canvas");

        // Rellenar fondo blanco para evitar PNGs transparentes negros en WhatsApp
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png", 1.0),
        );

        if (!blob) throw new Error("Error al generar el archivo de imagen");

        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);

        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 3000);
      } catch (err) {
        console.error("Error al copiar imagen:", err);
        alert(
          "No se pudo copiar la imagen al portapapeles. Intenta descargarla o usar captura de pantalla.",
        );
      } finally {
        setIsCopying(false);
      }
    }
  };

  const handleSend = () => {
    try {
      if (!lead.phone)
        return alert("Este prospecto no tiene número de teléfono.");

      const cleanPhone = lead.phone.replace(/\D/g, "");
      const encodedMessage = encodeURIComponent(message);
      const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      // Open WhatsApp
      window.open(url, "_blank");

      // Log interaction in CRM
      onSend(selectedProductId, message);
      onClose();
    } catch (error) {
      console.error("Error al procesar el envío:", error);
      alert("Ocurrió un error al intentar abrir WhatsApp.");
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              className="w-6 h-6 text-green-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Enviar Producto
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Seleccionar Producto
              </label>
              <select
                value={selectedProductId}
                onChange={handleProductChange}
                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">-- Elige un equipo --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Usar Plantilla
              </label>
              <select
                value={selectedTemplateId}
                onChange={handleTemplateChange}
                disabled={!selectedProductId}
                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Por defecto</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct && (
            <div className="bg-slate-700/50 p-4 rounded-lg flex flex-col sm:flex-row gap-4">
              {selectedProduct.image ? (
                <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-800 rounded-md overflow-hidden relative group">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-white font-bold">
                      Vista Previa
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 bg-slate-800 rounded-md flex items-center justify-center text-slate-500">
                  <span className="text-xs text-center p-2">Sin imagen</span>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase">
                  Mensaje (Editable)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full h-32 bg-slate-800 text-slate-200 p-2 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500 resize-none font-mono"
                />
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-md">
            <p className="text-blue-200 text-xs flex items-start gap-2">
              <span className="font-bold text-lg leading-none">ℹ️</span>
              <span>
                <strong>Nota:</strong> WhatsApp Web no permite adjuntar imágenes
                automáticamente desde un enlace.
                <br />
                Use el botón <strong>"1. Copiar Foto"</strong> y luego pegue la
                imagen (Ctrl+V) en el chat de WhatsApp.
              </span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {selectedProduct?.image && (
              <button
                onClick={copyImageToClipboard}
                disabled={isCopying}
                className={`flex-1 py-3 px-4 rounded-md font-semibold transition-all flex items-center justify-center gap-2 ${imageCopied ? "bg-green-600 text-white" : "bg-slate-600 hover:bg-slate-500 text-white"} ${isCopying ? "opacity-70 cursor-wait" : ""}`}
              >
                {isCopying ? (
                  "Procesando..."
                ) : imageCopied ? (
                  "¡Foto Copiada!"
                ) : (
                  <>
                    <span>1. Copiar Foto</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={!selectedProductId}
              className="flex-[2] py-3 px-4 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-md transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {selectedProduct?.image
                ? "2. Abrir WhatsApp y Pegar"
                : "Enviar Mensaje WhatsApp"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
