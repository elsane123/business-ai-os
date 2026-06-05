"""Factur-X PDF generation: weasyprint (HTML->PDF) + CII XML embed.

Produit un PDF hybride Factur-X profil BASIC (EN 16931).
"""
from datetime import datetime
from lxml import etree
from facturx import generate_from_binary
from models.schemas import FacturXRequest

# Namespaces CII
NS = {
    "rsm": "urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100",
    "ram": "urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100",
    "udt": "urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100",
    "qdt": "urn:un:unece:uncefact:data:standard:QualifiedDataType:100",
    "xsi": "http://www.w3.org/2001/XMLSchema-instance",
}


def _e(parent, ns_tag: str, text: str = None, attrib: dict = None):
    prefix, tag = ns_tag.split(":")
    el = etree.SubElement(parent, "{" + NS[prefix] + "}" + tag, attrib or {})
    if text is not None:
        el.text = text
    return el


def _fmt_date(iso: str) -> str:
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).strftime("%Y%m%d")
    except Exception:
        return datetime.now().strftime("%Y%m%d")


def build_cii_xml(req: FacturXRequest) -> bytes:
    """Genere le XML CII UN/CEFACT pour Factur-X profil BASIC."""
    inv = req.invoice
    seller = req.seller
    seller_name = seller.legalName or seller.businessName or seller.name or "Vendeur"
    buyer_name = inv.prospect.name if inv.prospect else "Client"

    root = etree.Element(
        "{" + NS["rsm"] + "}CrossIndustryInvoice",
        nsmap={"rsm": NS["rsm"], "ram": NS["ram"], "udt": NS["udt"], "qdt": NS["qdt"], "xsi": NS["xsi"]},
    )

    # ExchangedDocumentContext
    ctx = _e(root, "rsm:ExchangedDocumentContext")
    bpc = _e(ctx, "ram:BusinessProcessSpecifiedDocumentContextParameter")
    _e(bpc, "ram:ID", "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0")
    gdc = _e(ctx, "ram:GuidelineSpecifiedDocumentContextParameter")
    _e(gdc, "ram:ID", "urn:factur-x.eu:1p0:basic")

    # ExchangedDocument
    doc = _e(root, "rsm:ExchangedDocument")
    _e(doc, "ram:ID", inv.number)
    _e(doc, "ram:TypeCode", "380")
    issue_dt = _e(doc, "ram:IssueDateTime")
    dt_str = _e(issue_dt, "udt:DateTimeString", _fmt_date(inv.createdAt))
    dt_str.set("format", "102")

    # SupplyChainTradeTransaction
    tx = _e(root, "rsm:SupplyChainTradeTransaction")

    # Lignes de facture
    for i, line in enumerate(inv.lines, 1):
        item = _e(tx, "ram:IncludedSupplyChainTradeLineItem")
        doc_line = _e(item, "ram:AssociatedDocumentLineDocument")
        _e(doc_line, "ram:LineID", str(i))
        prod = _e(item, "ram:SpecifiedTradeProduct")
        _e(prod, "ram:Name", line.title)
        if line.description:
            _e(prod, "ram:Description", line.description)
        line_agreement = _e(item, "ram:SpecifiedLineTradeAgreement")
        net_price = _e(line_agreement, "ram:NetPriceProductTradePrice")
        _e(net_price, "ram:ChargeAmount", f"{line.unitPrice:.2f}")
        line_delivery = _e(item, "ram:SpecifiedLineTradeDelivery")
        qty_el = _e(line_delivery, "ram:BilledQuantity", f"{line.qty:.4f}")
        qty_el.set("unitCode", line.unit or "C62")
        line_settlement = _e(item, "ram:SpecifiedLineTradeSettlement")
        line_tax = _e(line_settlement, "ram:ApplicableTradeTax")
        _e(line_tax, "ram:TypeCode", "VAT")
        _e(line_tax, "ram:CategoryCode", "S" if line.vatRate > 0 else "E")
        _e(line_tax, "ram:RateApplicablePercent", f"{line.vatRate:.2f}")
        sum_el = _e(line_settlement, "ram:SpecifiedTradeSettlementLineMonetarySummation")
        _e(sum_el, "ram:LineTotalAmount", f"{line.qty * line.unitPrice:.2f}")

    # HeaderTradeAgreement
    header_agreement = _e(tx, "ram:ApplicableHeaderTradeAgreement")

    # Vendeur
    s_party = _e(header_agreement, "ram:SellerTradeParty")
    _e(s_party, "ram:Name", seller_name)
    s_legal = _e(s_party, "ram:SpecifiedLegalOrganization")
    if seller.siret:
        s_id = _e(s_legal, "ram:ID", seller.siret)
        s_id.set("schemeID", "0002")
    if seller.legalForm:
        _e(s_legal, "ram:TradingBusinessName", seller.businessName or seller_name)
    s_addr = _e(s_party, "ram:PostalTradeAddress")
    if seller.zipCode:
        _e(s_addr, "ram:PostcodeCode", seller.zipCode)
    if seller.address:
        _e(s_addr, "ram:LineOne", seller.address)
    if seller.city:
        _e(s_addr, "ram:CityName", seller.city)
    _e(s_addr, "ram:CountryID", "FR")
    if seller.vatNumber:
        s_tax = _e(s_party, "ram:SpecifiedTaxRegistration")
        s_tax_id = _e(s_tax, "ram:ID", seller.vatNumber)
        s_tax_id.set("schemeID", "VA")
    if seller.email:
        s_contact = _e(s_party, "ram:URIUniversalCommunication")
        s_uri = _e(s_contact, "ram:URIID", seller.email)
        s_uri.set("schemeID", "EM")

    # Acheteur
    b_party = _e(header_agreement, "ram:BuyerTradeParty")
    _e(b_party, "ram:Name", buyer_name)
    if inv.prospect and inv.prospect.company:
        b_legal = _e(b_party, "ram:SpecifiedLegalOrganization")
        _e(b_legal, "ram:TradingBusinessName", inv.prospect.company)
    b_addr = _e(b_party, "ram:PostalTradeAddress")
    _e(b_addr, "ram:CountryID", "FR")
    if inv.prospect and inv.prospect.email:
        b_contact = _e(b_party, "ram:URIUniversalCommunication")
        b_uri = _e(b_contact, "ram:URIID", inv.prospect.email)
        b_uri.set("schemeID", "EM")

    order_ref = _e(header_agreement, "ram:BuyerOrderReferencedDocument")
    _e(order_ref, "ram:IssuerAssignedID", inv.number)

    # HeaderTradeDelivery
    header_delivery = _e(tx, "ram:ApplicableHeaderTradeDelivery")
    event = _e(header_delivery, "ram:ActualDeliverySupplyChainEvent")
    occ = _e(event, "ram:OccurrenceDateTime")
    occ_dt = _e(occ, "udt:DateTimeString", _fmt_date(inv.createdAt))
    occ_dt.set("format", "102")

    # HeaderTradeSettlement
    header_settlement = _e(tx, "ram:ApplicableHeaderTradeSettlement")
    _e(header_settlement, "ram:InvoiceCurrencyCode", "EUR")

    # TVA par taux
    vat_groups: dict = {}
    for line in inv.lines:
        vat_groups[line.vatRate] = vat_groups.get(line.vatRate, 0) + line.qty * line.unitPrice * (line.vatRate / 100)
    for rate, vat_amount in vat_groups.items():
        h_tax = _e(header_settlement, "ram:ApplicableTradeTax")
        _e(h_tax, "ram:CalculatedAmount", f"{vat_amount:.2f}")
        _e(h_tax, "ram:TypeCode", "VAT")
        _e(h_tax, "ram:BasisAmount", f"{inv.subtotalHT:.2f}")
        _e(h_tax, "ram:CategoryCode", "S" if rate > 0 else "E")
        _e(h_tax, "ram:RateApplicablePercent", f"{rate:.2f}")

    if inv.dueDate:
        terms = _e(header_settlement, "ram:SpecifiedTradePaymentTerms")
        due = _e(terms, "ram:DueDateDateTime")
        due_dt = _e(due, "udt:DateTimeString", _fmt_date(inv.dueDate))
        due_dt.set("format", "102")

    if inv.notes:
        _e(header_settlement, "ram:PaymentReference", inv.notes[:70])

    summary = _e(header_settlement, "ram:SpecifiedTradeSettlementHeaderMonetarySummation")
    _e(summary, "ram:LineTotalAmount", f"{inv.subtotalHT:.2f}")
    _e(summary, "ram:TaxBasisTotalAmount", f"{inv.subtotalHT:.2f}")
    tax_total = _e(summary, "ram:TaxTotalAmount", f"{inv.totalVAT:.2f}")
    tax_total.set("currencyID", "EUR")
    _e(summary, "ram:GrandTotalAmount", f"{inv.totalTTC:.2f}")
    _e(summary, "ram:DuePayableAmount", f"{inv.totalTTC:.2f}")

    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", pretty_print=True)


def _fmt(n: float) -> str:
    return f"{n:,.2f}".replace(",", " ").replace(".", ",") + " EUR"


def _fmt_date_html(d: str | None) -> str:
    if not d:
        return "&mdash;"
    try:
        return datetime.fromisoformat(d.replace("Z", "+00:00")).strftime("%d/%m/%Y")
    except Exception:
        return d


def _render_html(req: FacturXRequest) -> str:
    inv = req.invoice
    seller = req.seller
    seller_name = seller.legalName or seller.businessName or seller.name or "Mon Entreprise"
    is_ae = not seller.vatNumber and (seller.legalForm == "Auto-entrepreneur" or not seller.legalForm)

    lines_rows = ""
    for line in inv.lines:
        total_ht = line.qty * line.unitPrice
        vat_col = "" if is_ae else f"<td style='padding:8px;text-align:center'>{line.vatRate}%</td>"
        desc = f"<br><small style='color:#6b7280'>{line.description}</small>" if line.description else ""
        lines_rows += (
            "<tr style='border-bottom:1px solid #e5e7eb'>"
            f"<td style='padding:8px'><strong>{line.title}</strong>{desc}</td>"
            f"<td style='padding:8px;text-align:center'>{line.qty}</td>"
            f"<td style='padding:8px;text-align:right'>{_fmt(line.unitPrice)}</td>"
            f"{vat_col}"
            f"<td style='padding:8px;text-align:right'><strong>{_fmt(total_ht)}</strong></td>"
            "</tr>"
        )

    vat_header = "" if is_ae else "<th style='padding:8px;text-align:center;background:#1a1a2e;color:white'>TVA</th>"
    vat_row = "" if is_ae else (
        f"<tr><td colspan='3' style='padding:6px 8px;text-align:right;color:#374151'>TVA</td>"
        f"<td style='padding:6px 8px;text-align:right'>{_fmt(inv.totalVAT)}</td></tr>"
    )
    ae_mention = "<p>TVA non applicable, article 293B du CGI</p>" if is_ae else ""

    notes_block = ""
    if inv.notes:
        notes_block = (
            "<div style='margin:16px 0;padding:12px;background:#f8fafc;border-left:3px solid #4f46e5'>"
            "<p style='margin:0 0 4px;font-size:11px;font-weight:600;color:#6b7280'>NOTES</p>"
            f"<p style='margin:0;white-space:pre-wrap'>{inv.notes}</p></div>"
        )

    footer_block = ""
    if seller.invoiceFooter:
        footer_block = (
            "<div style='margin:16px 0;padding:12px;background:#eff6ff;border-radius:6px;font-size:13px;color:#1e40af;white-space:pre-wrap'>"
            f"{seller.invoiceFooter}</div>"
        )

    paid_block = ""
    if inv.paidAt:
        paid_block = (
            "<div style='margin-top:8px;padding:6px 12px;background:#d1fae5;border-radius:6px;"
            "font-size:12px;color:#065f46;text-align:center;font-weight:600'>"
            f"Payee le {_fmt_date_html(inv.paidAt)}</div>"
        )

    seller_info = ""
    if seller.legalForm:
        seller_info += f"<p style='font-size:12px;color:#6b7280;margin:2px 0'>{seller.legalForm}</p>"
    if seller.address:
        seller_info += f"<p style='font-size:12px;color:#374151;margin-top:6px'>{seller.address}</p>"
    if seller.zipCode or seller.city:
        seller_info += f"<p style='font-size:12px;color:#374151'>{seller.zipCode or ''} {seller.city or ''}</p>"
    if seller.siret:
        seller_info += f"<p style='font-size:12px;color:#6b7280;margin-top:4px'>SIRET : {seller.siret}</p>"
    if seller.vatNumber:
        seller_info += f"<p style='font-size:12px;color:#6b7280'>N TVA : {seller.vatNumber}</p>"
    if seller.email:
        seller_info += f"<p style='font-size:12px;color:#6b7280'>{seller.email}</p>"

    prospect_block = "<p style='margin:0;color:#9ca3af'>Client non renseigne</p>"
    if inv.prospect:
        prospect_block = f"<p style='margin:0;font-weight:600;font-size:15px'>{inv.prospect.name}</p>"
        if inv.prospect.company:
            prospect_block += f"<p style='margin:2px 0 0;font-size:13px;color:#374151'>{inv.prospect.company}</p>"
        if inv.prospect.email:
            prospect_block += f"<p style='margin:4px 0 0;font-size:13px;color:#6b7280'>{inv.prospect.email}</p>"

    due_line = ""
    if inv.dueDate:
        due_line = f"<p style='margin:4px 0 0'>Echeance : <strong>{_fmt_date_html(inv.dueDate)}</strong></p>"

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Georgia, serif; background: white; margin: 0; padding: 32px; font-size: 13px; color: #1a1a2e; }}
    table {{ width: 100%; border-collapse: collapse; }}
    @page {{ size: A4; margin: 15mm; }}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
    <div>
      <h2 style="margin:0;font-size:20px;font-weight:700">{seller_name}</h2>
      {seller_info}
    </div>
    <div style="text-align:right">
      <div style="background:#1a1a2e;color:white;padding:12px 24px;border-radius:6px;display:inline-block">
        <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:0.7">Facture</p>
        <p style="margin:4px 0 0;font-size:22px;font-weight:700">{inv.number}</p>
      </div>
      <div style="margin-top:12px;font-size:13px;color:#374151;font-family:sans-serif">
        <p style="margin:0">Date : {_fmt_date_html(inv.createdAt)}</p>
        {due_line}
      </div>
    </div>
  </div>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:32px">
    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Facture a</p>
    {prospect_block}
  </div>

  <table style="margin-bottom:24px;font-family:sans-serif;font-size:13px">
    <thead>
      <tr style="background:#1a1a2e;color:white">
        <th style="padding:10px 12px;text-align:left">Designation</th>
        <th style="padding:10px 12px;text-align:center">Qte</th>
        <th style="padding:10px 12px;text-align:right">P.U. HT</th>
        {vat_header}
        <th style="padding:10px 12px;text-align:right">Total HT</th>
      </tr>
    </thead>
    <tbody>{lines_rows}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
    <div style="width:260px;font-family:sans-serif">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#374151">
        <span>Total HT</span><span>{_fmt(inv.subtotalHT)}</span>
      </div>
      {vat_row}
      <div style="display:flex;justify-content:space-between;padding:10px 12px;font-size:16px;font-weight:700;background:#1a1a2e;color:white;border-radius:6px;margin-top:8px">
        <span>Total TTC</span><span>{_fmt(inv.totalTTC)}</span>
      </div>
      {paid_block}
    </div>
  </div>

  {notes_block}
  {footer_block}

  <div style="border-top:1px solid #e5e7eb;padding-top:16px;font-family:sans-serif;font-size:11px;color:#9ca3af;line-height:1.6">
    {ae_mention}
    <p>En cas de retard de paiement, des penalites de retard seront appliquees au taux legal en vigueur.</p>
    <p>Indemnite forfaitaire pour frais de recouvrement : 40 EUR (art. L441-10 du Code de commerce).</p>
    <p>Escompte pour reglement anticipe : aucun.</p>
  </div>
</body>
</html>"""


async def generate_facturx_pdf(req: FacturXRequest) -> bytes:
    """Genere un PDF Factur-X BASIC : weasyprint + XML CII embarque."""
    from weasyprint import HTML  # lazy import — evite le crash au demarrage si les libs systeme manquent
    html = _render_html(req)
    pdf_bytes = HTML(string=html).write_pdf()
    xml_bytes = build_cii_xml(req)
    facturx_pdf = generate_from_binary(
        pdf_bytes,
        xml_bytes,
        flavor="factur-x",
        level="basic",
        check_xsd=False,
        check_schematron=False,
    )
    return facturx_pdf
