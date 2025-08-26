import markdown
import weasyprint

with open("outputs/blockchain-report.md", "r") as md_file:
    html = markdown.markdown(md_file.read())

weasyprint.HTML(string=html).write_pdf("outputs/blockchain-report.pdf")
