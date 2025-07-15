import { callApi } from "$lib/browser/api";

export const signOut = async () => {
    await callApi("/api/me/logout", "GET");
    await callApi("/auth/logout", "GET");

    document.cookie.split(";").forEach((cookie) => {
        const cookieName = cookie.split("=")[0].trim();
        document.cookie = `${cookieName}=; max-age=0; path=/`;
    });

    localStorage.clear();

    location.reload();
};
