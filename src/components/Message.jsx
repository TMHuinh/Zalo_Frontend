function Message({ text, own }) {
  return <div className={own ? "message own" : "message"}>{text}</div>;
}

export default Message;
