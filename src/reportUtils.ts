import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { BusinessSettings } from './types'

function fmtMoney(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10)
}

interface KPI { label: string; value: string }

function buildHeader(doc: jsPDF, settings: BusinessSettings, title: string, subtitle: string) {
  doc.setFillColor(220, 38, 38)
  doc.rect(0, 0, 210, 28, 'F')
  if (settings.logoUrl) {
    try { doc.addImage(settings.logoUrl, 'PNG', 12, 6, 16, 16) } catch { /* logo con formato no soportado por jsPDF, se omite */ }
  }
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.text(settings.name || 'PIZZAIAS', settings.logoUrl ? 32 : 14, 14)
  doc.setFontSize(10)
  doc.text(title, settings.logoUrl ? 32 : 14, 21)
  doc.setFontSize(9)
  doc.text(subtitle, 198, 14, { align: 'right' })
  doc.text(new Date().toLocaleString('es-MX'), 198, 21, { align: 'right' })
  doc.setTextColor(24, 24, 27)
}

function buildKpiRow(doc: jsPDF, kpis: KPI[], y: number) {
  const colWidth = 182 / kpis.length
  kpis.forEach((k, i) => {
    const x = 14 + i * colWidth
    doc.setFontSize(8)
    doc.setTextColor(113, 113, 122)
    doc.text(k.label.toUpperCase(), x, y)
    doc.setFontSize(13)
    doc.setTextColor(24, 24, 27)
    doc.text(k.value, x, y + 7)
  })
}

export function buildReportePDF(
  settings: BusinessSettings,
  period: 'dia' | 'semana' | 'mes',
  kpis: KPI[],
  dailyData: { label: string; revenue: number; pedidos: number }[],
  topProducts: [string, number][],
  payment: { cash: number; card: number },
) {
  const periodLabel = period === 'dia' ? 'Hoy' : period === 'semana' ? 'Última semana' : 'Último mes'
  const doc = new jsPDF()
  buildHeader(doc, settings, 'Reporte de ventas', periodLabel)
  buildKpiRow(doc, kpis, 42)

  autoTable(doc, {
    startY: 56,
    head: [[period === 'dia' ? 'Hora' : 'Día', 'Ingresos', 'Pedidos']],
    body: dailyData.map(d => [d.label, fmtMoney(d.revenue), String(d.pedidos)]),
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 9 },
  })

  const afterDaily = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  autoTable(doc, {
    startY: afterDaily,
    head: [['Producto más vendido', 'Unidades']],
    body: topProducts.length ? topProducts.map(([name, qty]) => [name, String(qty)]) : [['Sin datos en el periodo', '-']],
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 9 },
  })

  const afterProducts = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  autoTable(doc, {
    startY: afterProducts,
    head: [['Método de pago', 'Total']],
    body: [['Efectivo', fmtMoney(payment.cash)], ['Tarjeta', fmtMoney(payment.card)]],
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 9 },
  })

  return { doc, filename: `reporte-${period}-${todayStamp()}.pdf` }
}

export function buildDashboardPDF(
  settings: BusinessSettings,
  kpis: KPI[],
  todayOrders: { orderNumber: string; customer?: string; paymentMethod: string; total: number; status: string; createdAt: Date }[],
  stockAlerts?: { lowStock: { name: string; stock: number; unit: string; minStock: number }[]; expiring: { name: string; stock: number; unit: string; daysLeft: number }[] },
) {
  const doc = new jsPDF()
  buildHeader(doc, settings, 'Resumen del día (Dashboard)', 'Hoy')
  buildKpiRow(doc, kpis, 42)

  autoTable(doc, {
    startY: 56,
    head: [['Folio', 'Cliente', 'Pago', 'Estado', 'Hora', 'Total']],
    body: todayOrders.length
      ? todayOrders.map(o => [
          o.orderNumber,
          o.customer || 'Venta mostrador',
          o.paymentMethod === 'efectivo' ? 'Efectivo' : 'Tarjeta',
          o.status,
          new Date(o.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          fmtMoney(o.total),
        ])
      : [['Sin pedidos registrados hoy', '', '', '', '', '']],
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 8.5 },
  })

  if (stockAlerts && (stockAlerts.lowStock.length || stockAlerts.expiring.length)) {
    const afterOrders = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
    doc.setFontSize(10)
    doc.setTextColor(217, 119, 6)
    doc.text('Insumos a revisar para mañana (stock bajo / por caducar)', 14, afterOrders - 4)
    autoTable(doc, {
      startY: afterOrders,
      head: [['Insumo', 'Alerta', 'Stock']],
      body: [
        ...stockAlerts.lowStock.map(i => [i.name, `Stock bajo (mín. ${i.minStock})`, `${i.stock} ${i.unit}`]),
        ...stockAlerts.expiring.map(i => [i.name, i.daysLeft < 0 ? `Caducó hace ${Math.abs(i.daysLeft)}d` : i.daysLeft === 0 ? 'Caduca hoy' : `Caduca en ${i.daysLeft}d`, `${i.stock} ${i.unit}`]),
      ],
      theme: 'striped',
      headStyles: { fillColor: [217, 119, 6] },
      styles: { fontSize: 8.5 },
    })
  }

  return { doc, filename: `dashboard-historial-${todayStamp()}.pdf` }
}

export function buildCorteCajaPDF(
  settings: BusinessSettings,
  data: { initialFloat: number; cashSales: number; cardSales: number; expected: number; actual: number; diff: number; shortageReason?: string; closedBy: string },
) {
  const doc = new jsPDF()
  buildHeader(doc, settings, 'Corte de Caja', todayStamp())
  autoTable(doc, {
    startY: 36,
    head: [['Concepto', 'Monto']],
    body: [
      ['Fondo inicial', fmtMoney(data.initialFloat)],
      ['Ventas efectivo', fmtMoney(data.cashSales)],
      ['Ventas tarjeta', fmtMoney(data.cardSales)],
      ['Total esperado', fmtMoney(data.expected)],
      ['Total contado', fmtMoney(data.actual)],
      [data.diff === 0 ? 'Cuadrado' : data.diff > 0 ? 'Sobrante' : 'Faltante', fmtMoney(Math.abs(data.diff))],
      ['Cerrado por', data.closedBy],
    ],
    theme: 'striped',
    headStyles: { fillColor: [220, 38, 38] },
    styles: { fontSize: 10 },
  })
  if (data.shortageReason) {
    const afterTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    doc.setTextColor(220, 38, 38)
    doc.text('Motivo del faltante:', 14, afterTable)
    doc.setTextColor(63, 63, 70)
    doc.text(doc.splitTextToSize(data.shortageReason, 180), 14, afterTable + 6)
  }
  return { doc, filename: `corte-caja-${todayStamp()}.pdf` }
}

// Descarga el PDF y abre el cliente de correo del usuario con el destinatario, asunto
// y cuerpo pre-llenados. Los navegadores no permiten adjuntar archivos vía mailto:,
// así que se le pide al usuario adjuntar manualmente el PDF ya descargado.
export function sendPdfByEmail(doc: jsPDF, filename: string, to: string, subject: string, bodyLines: string[]) {
  doc.save(filename)
  const body = [...bodyLines, '', `Nota: adjunta manualmente el archivo descargado (${filename}) a este correo.`].join('\n')
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailto, '_blank')
}
