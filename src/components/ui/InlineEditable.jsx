// ## (Only used in Admin mode — inline lesson editing)



export default function InlineEditable({ value, onChange, multiline, style: sx = {} }) {
  if (multiline) {
    return (
      <textarea
        className="editable-field"
        defaultValue={value}
        onBlur={e => onChange(e.target.value)}
        rows={Math.max(2, (value || "").split("\n").length + 1)}
        style={{
          width: "100%",
          resize: "vertical",
          background: "transparent",
          border: "2px dashed transparent",
          borderRadius: 10,
          padding: "4px 8px",
          fontFamily: "'Nunito'",
          fontSize: "inherit",
          lineHeight: "inherit",
          ...sx,
        }}
      />
    );
  }
  return (
    <input
      className="editable-field"
      defaultValue={value}
      onBlur={e => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "transparent",
        border: "2px dashed transparent",
        borderRadius: 10,
        padding: "4px 8px",
        fontFamily: "'Baloo 2'",
        fontWeight: "inherit",
        fontSize: "inherit",
        ...sx,
      }}
    />
  );
}