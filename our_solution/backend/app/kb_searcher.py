"""
Knowledge Base search functionality.
"""

from typing import List, Dict


class KnowledgeBaseSearcher:
    """Search and retrieve knowledge base articles."""

    def __init__(self, kb_path: str):
        self.kb_path = kb_path
        self.content = self._load_kb()
        self.articles = self._parse_articles()

    def _load_kb(self) -> str:
        """Load knowledge base content."""
        try:
            with open(self.kb_path, "r", encoding="utf-8") as kb_file:
                return kb_file.read()
        except FileNotFoundError:
            return ""

    def _parse_articles(self) -> List[Dict]:
        """Parse KB into individual articles."""
        articles = []
        current_article = None

        for line in self.content.split("\n"):
            if line.startswith(("CNTR:", "VSL:", "VAS:", "EDI:", "API:")):
                if current_article:
                    articles.append(current_article)
                # Map VAS to VSL for consistency
                module = line.split(":")[0] if ":" in line else "Unknown"
                if module == "VAS":
                    module = "VSL"
                current_article = {
                    "title": line.strip(),
                    "content": "",
                    "module": module,
                }
            elif current_article:
                current_article["content"] += line + "\n"

        if current_article:
            articles.append(current_article)

        return articles

    def search_by_keywords(self, keywords: List[str]) -> List[Dict]:
        """Search for articles containing keywords."""
        matching_articles = []

        for article in self.articles:
            full_text = (article["title"] + "\n" + article["content"]).lower()
            keyword_matches = sum(1 for keyword in keywords if keyword.lower() in full_text)

            if keyword_matches > 0:
                matching_articles.append(
                    {**article, "relevance_score": keyword_matches / len(keywords)}
                )

        matching_articles.sort(key=lambda x: x["relevance_score"], reverse=True)
        return matching_articles

    def search_by_module(self, module: str) -> List[Dict]:
        """Get all articles for a specific module (CNTR, VSL, EDI, API)."""
        # Map common module names to KB prefixes
        module_map = {
            'container': 'CNTR',
            'vessel': 'VSL',
            'edi': 'EDI',
            'api': 'API'
        }
        
        # Try to map the module name, otherwise use as-is
        target_module = module_map.get(module.lower(), module.upper())
        
        return [article for article in self.articles if article["module"].upper() == target_module]

    def get_article_by_title(self, title: str) -> Dict:
        """Get a specific article by title."""
        for article in self.articles:
            if title.lower() in article["title"].lower():
                return article
        return None

    def format_articles(self, articles: List[Dict], max_articles: int = 3) -> str:
        """Format articles as readable text for GPT context."""
        if not articles:
            return "No relevant knowledge base articles found."

        output = []
        for i, article in enumerate(articles[:max_articles]):
            output.append(f"=== Article {i + 1}: {article['title']} ===")
            output.append(article["content"][:2000])  # Increased from 1000 to 2000
            output.append("")

        return "\n".join(output)

    def get_full_content(self) -> str:
        """Get the full KB content (for GPT context when needed)."""
        return self.content
