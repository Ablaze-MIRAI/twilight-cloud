interface googleUserInfoApiResponse {
    id: string
    name: string
    given_name: string
    picture: string
}

export interface UserProfile {
    uid: string
    displayName: string
    avatarUrl: string | null
}

export interface IdentService {
    // ユーザーを一意に識別するためのIDを取得する
    // メールアドレスは変動する場合があるので極力使わない
    // ex. Googleの場合: "google:[googleのユーザーID]"
    getUniqueUserId(token: string): Promise<string>

    // ユーザーの表示名とアバターを取得する
    // 一意である必要はない
    getProfile(token: string):  Promise<UserProfile>
}

export class GoogleIdentService implements IdentService {
    private readonly googleApiUserInfoUrl: string = "https://www.googleapis.com/oauth2/v2/userinfo";

    private async requestUserInfo(token: string): Promise<googleUserInfoApiResponse> {
        const response = await fetch(this.googleApiUserInfoUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
        if (response.ok && response.body) {
            const body = await response.text();
            const data = JSON.parse(body) as googleUserInfoApiResponse;
            if (!data.id) {
                throw new Error("Failed to get user info");
            }

            return data;
        } else {
            throw new Error("Failed to get user info");
        }
    }

    async getUniqueUserId(token: string): Promise<string> {
        const user = await this.requestUserInfo(token);
        return `google:${user.id}`;
    }

    async getProfile(token: string): Promise<UserProfile> {
        const user = await this.requestUserInfo(token);
        // 空ならNew Userとする
        return {
            uid: `google:${user.id}`,
            displayName: user.name || "New User",
            avatarUrl: user.picture || null,
        };
    }
}