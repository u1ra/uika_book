from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models import Book, BookChapter
from app.services.chapter_splitter import ChapterSegment


def save_book_chapters(db: Session, book: Book, chapters: list[ChapterSegment]) -> list[BookChapter]:
    saved_chapters = [
        BookChapter(
            book_id=book.id,
            chapter_index=chapter.chapter_index,
            chapter_title=chapter.chapter_title,
            start_offset=chapter.start_offset,
            end_offset=chapter.end_offset,
        )
        for chapter in chapters
    ]
    db.add_all(saved_chapters)
    book.total_chapters = len(chapters)
    return saved_chapters


def replace_book_chapters(db: Session, book: Book, chapters: list[ChapterSegment]) -> list[BookChapter]:
    db.execute(delete(BookChapter).where(BookChapter.book_id == book.id))
    return save_book_chapters(db, book, chapters)
