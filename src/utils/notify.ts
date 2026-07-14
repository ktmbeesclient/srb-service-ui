import { showNotification } from "@mantine/notifications";

const showNotify = (condition: string, message: string) => {
  showNotification({
    autoClose: 5000,
    message,
    color: `${
      condition === "success"
        ? "green"
        : condition === "error"
          ? "red"
          : condition === "warning"
            ? "yellow"
            : condition === "notify"
              ? "blue"
              : ""
    }`,
    style: {
      backgroundColor: "whitesmoke",
      height: "60px",
      color: "white",
    },
    loading: false,
  });
};

export default showNotify;