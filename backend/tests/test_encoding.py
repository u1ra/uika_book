import pytest

from app.utils.encoding import EncodingDetectionError, detect_text_encoding


def test_detect_utf8_with_bom():
    encoding, text = detect_text_encoding("第1章 开始".encode("utf-8-sig"))
    assert encoding == "utf-8"
    assert text == "第1章 开始"


def test_detect_utf16_with_bom():
    encoding, text = detect_text_encoding("第1章 开始".encode("utf-16"))
    assert encoding == "utf-16"
    assert text == "第1章 开始"


def test_detect_utf16_without_bom():
    encoding, text = detect_text_encoding("第1章 开始".encode("utf-16-le"))
    assert encoding == "utf-16"
    assert text == "第1章 开始"


def test_detect_gbk():
    encoding, text = detect_text_encoding("第1章 开始".encode("gbk"))
    assert encoding == "gbk"
    assert text == "第1章 开始"


def test_detect_gb18030_only_characters():
    # “𠮷”等扩展区字符在 GBK 码表之外，但属于 GB18030。
    raw = "第1章 𠮷".encode("gb18030")
    encoding, text = detect_text_encoding(raw)
    assert encoding == "gb18030"
    assert text == "第1章 𠮷"


def test_nul_containing_non_utf16_falls_back_to_gbk():
    # 含 NUL 但不是合法 UTF-16（奇数字节）的文件应继续回落到 GBK，
    # 而不是把 _decode_utf16 抛出的 EncodingDetectionError 直接抛给调用方。
    raw = "第1章\x00内容".encode("gbk")
    encoding, text = detect_text_encoding(raw)
    assert encoding == "gbk"
    assert text == "第1章\x00内容"


def test_undetectable_bytes_raise_encoding_detection_error():
    with pytest.raises(EncodingDetectionError):
        detect_text_encoding(b"\xff\xfe\xff\xfe\x00\x81")


def test_empty_input_returns_utf8_empty_text():
    assert detect_text_encoding(b"") == ("utf-8", "")
