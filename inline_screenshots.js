// 将截图转成 Base64 内嵌到 HTML，生成自包含单文件报告
const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Admin/Desktop/测试资料/report_deploy';
const htmlPath = path.join(dir, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// 匹配 href="screenshots/xxx.png" 或 src="screenshots/xxx.png"
const regex = /(href|src)=["'](screenshots\/[^"']+)["']/g;
let m;
const refs = new Set();
while ((m = regex.exec(html)) !== null) {
  refs.add(m[2]); // m[2] is the path
}

console.log('找到 ' + refs.size + ' 个截图引用');

let result = html;
let embedded = 0;
for (const ref of refs) {
  const filePath = path.join(dir, ref.replace(/\//g, path.sep));
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
    const mime = ext === 'jpg' ? 'jpeg' : ext;
    const base64 = fs.readFileSync(filePath).toString('base64');
    const dataUri = 'data:image/' + mime + ';base64,' + base64;
    // 替换 href="screenshots/..." 为 href="data:image/..."
    const pattern = new RegExp('(href|src)=["\']' + ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '["\']', 'g');
    result = result.replace(pattern, 'href="data:' + mime + ';base64,' + base64 + '"');
    embedded++;
    console.log('  [OK] ' + ref + ' -> 内嵌 ' + (base64.length / 1024).toFixed(0) + 'KB');
  } else {
    console.log('  [MISS] ' + ref + ' 文件不存在!');
  }
}

const outPath = path.join(dir, 'report_embedded.html');
fs.writeFileSync(outPath, result);
console.log('完成: 内嵌 ' + embedded + '/' + refs.size + ' 张截图');
const sizeMB = fs.statSync(outPath).size / 1024 / 1024;
console.log('输出: ' + outPath + ' (' + sizeMB.toFixed(1) + ' MB)');
if (sizeMB > 10) {
  console.log('警告: 文件较大 (' + sizeMB.toFixed(1) + 'MB)，建议用分拆方案');
}
