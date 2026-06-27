$dst = Join-Path $PSScriptRoot ''
$videos = @(
  'D:\BaiduNetdiskDownload\纪录片 九黎\片段7.mp4',
  'D:\BaiduNetdiskDownload\纪录片解忧防空洞\片段2 开头空镜.mp4',
  'D:\BaiduNetdiskDownload\微电影 夏\片段7 混剪.mp4',
  'D:\BaiduNetdiskDownload\微电影 向北走\片段2（向北）.mp4',
  'D:\BaiduNetdiskDownload\公益广告 爱守护\片段1+2.mp4',
  'D:\BaiduNetdiskDownload\广告 荔枝肌\片段1+2.mp4',
  'D:\BaiduNetdiskDownload\广告可画app\片段1 片头特效.mp4',
  'D:\BaiduNetdiskDownload\广告棱角\片段1 洁面.mp4'
)
$docs = @(
  'D:\BaiduNetdiskDownload\纪录片 九黎\纪录片 《苗影天成·九黎印象》 呈现文字.docx',
  'D:\BaiduNetdiskDownload\纪录片解忧防空洞\微纪录 解忧防空洞 呈现文字.docx',
  'D:\BaiduNetdiskDownload\微电影 夏\微电影 夏的第三章 呈现文字.docx',
  'D:\BaiduNetdiskDownload\微电影 向北走\微电影 你向北走啊走 呈现文字.docx',
  'D:\BaiduNetdiskDownload\公益广告 爱守护\公益广告《让爱无碍，为爱守护》呈现文字.docx',
  'D:\BaiduNetdiskDownload\广告 荔枝肌\广告《邂逅“荔枝”肌，透亮触手可及》（ddg卸妆膏） 呈现文字.docx',
  'D:\BaiduNetdiskDownload\广告可画app\广告《一键换型，可画随行》（可画app） 呈现文字.docx',
  'D:\BaiduNetdiskDownload\广告棱角\广告《有棱角不“油”虑，青春先享不等待》（郁美净） 呈现文字.docx',
  'D:\BaiduNetdiskDownload\笔墨叙事（文字作品板块)设计.docx',
  'D:\BaiduNetdiskDownload\作品集板块设计.docx',
  'D:\BaiduNetdiskDownload\视频作品 总.docx',
  'D:\BaiduNetdiskDownload\新媒体IP运营.docx',
  'D:\BaiduNetdiskDownload\内容运营.docx',
  'D:\BaiduNetdiskDownload\品牌活动企划运营.docx'
)
$icons = @(
  'D:\BaiduNetdiskDownload\运营作品\公众号图标.png',
  'D:\BaiduNetdiskDownload\运营作品\小红书图标.png',
  'D:\BaiduNetdiskDownload\运营作品\抖音图标.png'
)

foreach($v in $videos){
  if(Test-Path $v){ Copy-Item -LiteralPath $v -Destination (Join-Path $PSScriptRoot 'videos') -Force; Write-Output "Copied video: $v" } else { Write-Output "Missing video: $v" }
}
foreach($d in $docs){
  if(Test-Path $d){ Copy-Item -LiteralPath $d -Destination (Join-Path $PSScriptRoot 'docs') -Force; Write-Output "Copied doc: $d" } else { Write-Output "Missing doc: $d" }
}
foreach($i in $icons){
  if(Test-Path $i){ Copy-Item -LiteralPath $i -Destination (Join-Path $PSScriptRoot 'icons') -Force; Write-Output "Copied icon: $i" } else { Write-Output "Missing icon: $i" }
}
Write-Output 'Copy script finished.'
