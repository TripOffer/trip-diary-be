import * as fs from 'fs';
import * as path from 'path';

// 日志文件路径
export const logDirectory = path.resolve(process.cwd(), 'logs');
export const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' },
);

// 确保 logs 目录存在
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}
