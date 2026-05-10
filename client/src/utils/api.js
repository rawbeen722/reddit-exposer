import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 35000,
});

export async function fetchUserProfile(username) {
    const { data } = await api.get(`/user/${encodeURIComponent(username)}`);
    return data;
}

export async function fetchUserPosts(username, params = {}) {
    const { data } = await api.get(`/user/${encodeURIComponent(username)}/posts`, { params });
    return data;
}

export async function fetchUserComments(username, params = {}) {
    const { data } = await api.get(`/user/${encodeURIComponent(username)}/comments`, { params });
    return data;
}

export async function fetchUserSubreddits(username, params = {}) {
    const { data } = await api.get(`/user/${encodeURIComponent(username)}/subreddits`, { params });
    return data;
}

export async function fetchUserInteractions(username, params = {}) {
    const { data } = await api.get(`/user/${encodeURIComponent(username)}/interactions`, { params });
    return data;
}

export async function fetchUserFlairs(username) {
    const { data } = await api.get(`/user/${encodeURIComponent(username)}/flairs`);
    return data;
}

export async function fetchUserActivity(username, params = {}) {
    const { data } = await api.get(`/user/${encodeURIComponent(username)}/activity`, { params });
    return data;
}
