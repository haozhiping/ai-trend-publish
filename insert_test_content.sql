-- 内容库测试数据插入脚本
-- 如果表中有数据，可以先清空：DELETE FROM `content`;

INSERT INTO `content` (`title`, `content`, `summary`, `url`, `source`, `platform`, `score`, `keywords`, `tags`, `status`, `publish_date`) VALUES
('DeepSeek-R1 登顶AI模型排行榜', 'DeepSeek-R1在最新的AI模型评测中表现出色，在多个基准测试中取得了领先成绩。该模型在推理能力、代码生成和数学问题解决方面都有显著提升，成为当前最受关注的开源大模型之一。', 'DeepSeek-R1在AI模型评测中表现优异，成为开源大模型新标杆。', 'https://example.com/deepseek-r1', 'twitter', 'weixin', 95.5, '["AI", "DeepSeek", "排行榜"]', '["技术", "AI模型"]', 'published', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('OpenAI发布新版本GPT模型', 'OpenAI今日宣布发布新版本的GPT模型，在保持原有优势的基础上，进一步优化了响应速度和准确性。新版本在长文本处理和多轮对话方面有显著改进，预计将进一步提升用户体验。', 'OpenAI发布新版GPT模型，优化响应速度和准确性。', 'https://example.com/openai-gpt', 'firecrawl', 'weixin', 88.2, '["OpenAI", "GPT", "新版本"]', '["AI", "技术"]', 'published', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('GitHub热门AI项目推荐', '本周GitHub上最受欢迎的AI项目包括多个开源大模型框架和工具库。这些项目在社区中获得了广泛关注，为开发者提供了丰富的AI开发资源。', 'GitHub本周热门AI项目盘点，开源大模型框架受关注。', 'https://example.com/github-ai', 'hellogithub', 'weixin', 82.7, '["GitHub", "AI项目", "开源"]', '["开源", "开发"]', 'draft', NULL),
('AI在医疗领域的应用突破', '最新研究显示，AI技术在医疗诊断和治疗方案制定方面取得了重要突破。通过深度学习算法，AI能够辅助医生进行更精准的疾病诊断，提高诊疗效率。', 'AI技术在医疗诊断领域取得重要突破，提升诊疗精准度。', 'https://example.com/ai-medical', 'firecrawl', 'weixin', 91.3, '["AI", "医疗", "诊断"]', '["医疗", "AI应用"]', 'published', DATE_SUB(NOW(), INTERVAL 3 DAY)),
('大语言模型训练成本大幅下降', '随着硬件技术的进步和算法优化，大语言模型的训练成本在过去一年中大幅下降。这使得更多研究机构和企业能够参与到AI模型的研发中来。', '大语言模型训练成本下降，推动AI研发普及。', 'https://example.com/llm-cost', 'twitter', 'weixin', 79.8, '["大模型", "训练", "成本"]', '["技术", "成本"]', 'draft', NULL),
('AI生成内容的质量评估标准', '业界正在制定AI生成内容的质量评估标准，以帮助用户更好地判断和使用AI生成的内容。这些标准将涵盖准确性、原创性、相关性等多个维度。', '业界制定AI生成内容质量评估标准，提升内容质量。', 'https://example.com/ai-content-quality', 'firecrawl', 'weixin', 85.6, '["AI生成", "内容质量", "评估"]', '["标准", "质量"]', 'published', DATE_SUB(NOW(), INTERVAL 4 DAY));

