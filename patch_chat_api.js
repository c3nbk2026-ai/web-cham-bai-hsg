const fs = require('fs');

let route = fs.readFileSync('src/app/api/chat/route.ts', 'utf8');

const regex = /const \{ message, documentName, history \} = body;[\s\S]*?contents\.push\(\{\s*role: 'user',\s*parts: \[\{ text: message \}\]\s*\}\);/;

const newLogic = `const { message, documentName, history, attachment } = body;

        const systemInstruction = \`B\u1EA1n l\u00E0 m\u1ED9t gi\u00E1o vi\u00EAn chuy\u00EAn b\u1ED3i d\u01B0\u1EE1ng H\u1ECDc sinh gi\u1ECFi m\u00F4n Tin h\u1ECDc (C++, Python). H\u1ECDc sinh \u0111ang t\u1EF1 h\u1ECDc t\u00E0i li\u1EC7u c\u00F3 t\u00EAn: "\${documentName}". H\u00E3y gi\u1EA3i \u0111\u00E1p c\u00E1c th\u1EAFc m\u1EAFc c\u1EE7a h\u1ECDc sinh m\u1ED9t c\u00E1ch d\u1EC5 hi\u1EC3u, s\u01B0 ph\u1EA1m, v\u00E0 ng\u1EAFn g\u1ECDn. Khuy\u1EBFn kh\u00EDch h\u1ECDc sinh suy ngh\u0129 thay v\u00EC \u0111\u01B0a code gi\u1EA3i s\u1EB5n ngay l\u1EADp t\u1EE9c. D\u00F9ng ng\u00F4n ng\u1EEF th\u00E2n thi\u1EC7n, x\u01B0ng th\u1EA7y/c\u00F4 v\u00E0 g\u1ECDi h\u1ECDc sinh l\u00E0 em.\`;

        const contents = history.map((msg: any) => {
            const parts: any[] = [];
            if (msg.attachment) {
                parts.push({
                    inlineData: {
                        mimeType: msg.attachment.mimeType,
                        data: msg.attachment.data
                    }
                });
            }
            if (msg.text) parts.push({ text: msg.text });
            return {
                role: msg.role === 'user' ? 'user' : 'model',
                parts: parts
            };
        });

        const userParts: any[] = [];
        if (attachment) {
            userParts.push({
                inlineData: {
                    mimeType: attachment.mimeType,
                    data: attachment.data
                }
            });
        }
        if (message) userParts.push({ text: message });

        contents.push({
            role: 'user',
            parts: userParts
        });`;

route = route.replace(regex, newLogic);
// Fix the remaining corrupted Vietnamese
route = route.replace('H th`ng cha cu hAnh AI (Thiu API Key).', 'H\u1EC7 th\u1ED1ng ch\u01B0a c\u1EA5u h\u00ECnh AI (Thi\u1EBFu API Key).');
route = route.replace('Xin l-i, th y/cA\' khA\'ng th tr l?i lAc nAy.', 'Xin l\u1ED7i, th\u1EA7y/c\u00F4 kh\u00F4ng th\u1EC3 tr\u1EA3 l\u1EDDi l\u00FAc n\u00E0y.');
route = route.replace('L-i kt n`i AI: ', 'L\u1ED7i k\u1EBFt n\u1ED1i AI: ');

fs.writeFileSync('src/app/api/chat/route.ts', route, 'utf8');
