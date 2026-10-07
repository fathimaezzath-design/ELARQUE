import React from "react";
import { ANNOUNCEMENT_DATA } from "../../data/homeData";

function AnnouncementBar() {
  return (
    <aside aria-label="Announcement" style={styles.bar}>
      <div style={styles.container}>
        <span style={styles.text}>{ANNOUNCEMENT_DATA.text}</span>
      </div>
    </aside>
  );
}

const styles = {
  bar: {
    backgroundColor: "var(--el-burgundy)",
    color: "#FAF6F0",
    padding: "9px 16px",
    textAlign: "center",
    fontSize: "11px",
    letterSpacing: "2.5px",
    fontWeight: "500",
    textTransform: "uppercase",
    fontFamily: "var(--font-sans)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  },
  container: {
    maxWidth: "var(--container-max)",
    margin: "0 auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    opacity: 0.95,
  },
};

export default AnnouncementBar;
