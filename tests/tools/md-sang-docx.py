# Chuyển BAO-CAO-KIEM-THU.md -> .docx (tiêu đề, đoạn, gạch đầu dòng, bảng, chữ đậm/code);
# dòng "Ảnh minh chứng" có tên file .jpg thì chèn ảnh thật từ thư mục anh/.
# Dùng: python tools/md-sang-docx.py ket-qua/BAO-CAO-KIEM-THU.md ket-qua/BAO-CAO-KIEM-THU.docx
import re, sys, os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

nguon, dich = sys.argv[1], sys.argv[2]
THU_MUC_ANH = os.path.join(os.path.dirname(os.path.abspath(nguon)), '..', 'anh')

doc = Document()
for s in doc.sections:
    s.left_margin = s.right_margin = Cm(2.2); s.top_margin = s.bottom_margin = Cm(2)
st = doc.styles['Normal']; st.font.name = 'Times New Roman'; st.font.size = Pt(12)
st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')
for i in range(1, 4):
    h = doc.styles['Heading %d' % i]; h.font.name = 'Times New Roman'; h.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
    h.element.rPr.rFonts.set(qn('w:eastAsia'), 'Times New Roman')

def chen_chu(p, text):
    # **đậm**, `code`
    for phan in re.split(r'(\*\*[^*]+\*\*|`[^`]+`)', text):
        if not phan: continue
        if phan.startswith('**'):
            r = p.add_run(phan[2:-2]); r.bold = True
        elif phan.startswith('`'):
            r = p.add_run(phan[1:-1]); r.font.name = 'Consolas'; r.font.size = Pt(10)
        else:
            p.add_run(phan)

def to_nen(o, mau):
    tcPr = o._tc.get_or_add_tcPr(); sh = OxmlElement('w:shd')
    sh.set(qn('w:val'), 'clear'); sh.set(qn('w:color'), 'auto'); sh.set(qn('w:fill'), mau); tcPr.append(sh)

def them_bang(dong):
    hang = [[c.strip() for c in d.strip().strip('|').split('|')] for d in dong if not re.match(r'^\|\s*-', d)]
    so_cot = max(len(h) for h in hang)
    bang = doc.add_table(rows=0, cols=so_cot); bang.style = 'Table Grid'
    anh_sau = []
    for i, h in enumerate(hang):
        cells = bang.add_row().cells
        for j in range(so_cot):
            gt = h[j] if j < len(h) else ''
            p = cells[j].paragraphs[0]; chen_chu(p, gt.replace('<br>', '\n'))
            for r in p.runs: r.font.size = Pt(10.5)
            if i == 0:
                for r in p.runs: r.bold = True
                to_nen(cells[j], 'E5E7EB')
            if gt == 'Đạt': to_nen(cells[j], 'D1FAE5')
            if gt == 'Không đạt': to_nen(cells[j], 'FFE4E6')
        if len(h) >= 2 and 'Ảnh minh chứng' in h[0]:
            anh_sau += re.findall(r'(TC-S\d+-\d+(?:_loi)?\.jpg)', h[1])
    doc.add_paragraph()
    for ten in anh_sau[:2]:
        f = os.path.join(THU_MUC_ANH, ten)
        if os.path.exists(f):
            doc.add_picture(f, width=Cm(15)); doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER
            c = doc.add_paragraph('Hình: ảnh minh chứng ' + ten); c.alignment = WD_ALIGN_PARAGRAPH.CENTER
            c.runs[0].italic = True; c.runs[0].font.size = Pt(10)

dong = open(nguon, encoding='utf-8').read().split('\n')
i = 0
while i < len(dong):
    d = dong[i]
    if d.startswith('|'):
        bang = []
        while i < len(dong) and dong[i].startswith('|'): bang.append(dong[i]); i += 1
        them_bang(bang); continue
    m = re.match(r'^(#{1,3})\s+(.*)', d)
    if m:
        cap = len(m.group(1))
        if cap == 1:
            t = doc.add_heading(m.group(2), 0); t.alignment = WD_ALIGN_PARAGRAPH.CENTER
        else:
            doc.add_heading(m.group(2), cap - 1)
    elif re.match(r'^\s*[-*]\s+', d):
        chen_chu(doc.add_paragraph(style='List Bullet'), re.sub(r'^\s*[-*]\s+', '', d))
    elif re.match(r'^\s*\d+\.\s+', d):
        chen_chu(doc.add_paragraph(style='List Number'), re.sub(r'^\s*\d+\.\s+', '', d))
    elif d.strip() in ('---', ''):
        pass
    else:
        chen_chu(doc.add_paragraph(), d.strip())
    i += 1
doc.save(dich)
print('Đã ghi', dich)
