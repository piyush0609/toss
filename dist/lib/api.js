async function safeFetch(url, init) {
    try {
        return await fetch(url, init);
    }
    catch {
        throw new Error(`Could not reach ${url}. Is your hull deployed and reachable?`);
    }
}
export class HullAPI {
    config;
    constructor(config) {
        this.config = config;
    }
    async upload(html, name, expiresSeconds) {
        const url = new URL('/artifacts', this.config.endpoint);
        url.searchParams.set('expires', String(expiresSeconds));
        url.searchParams.set('name', name);
        const res = await safeFetch(url.href, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.ownerToken}`,
                'Content-Type': 'text/html',
            },
            body: new Uint8Array(html),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Upload failed: ${res.status} ${text}`);
        }
        return res.json();
    }
    async uploadFile(artifactId, relativePath, data) {
        const url = new URL(`/artifacts/${artifactId}/files`, this.config.endpoint);
        url.searchParams.set('path', relativePath);
        const res = await safeFetch(url.href, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.ownerToken}`,
                'Content-Type': 'application/octet-stream',
            },
            body: new Uint8Array(data),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Upload failed for ${relativePath}: ${res.status} ${text}`);
        }
    }
    async list() {
        const res = await safeFetch(`${this.config.endpoint}/artifacts`, {
            headers: { Authorization: `Bearer ${this.config.ownerToken}` },
        });
        if (!res.ok)
            throw new Error(`List failed: ${res.status}`);
        return res.json();
    }
    async revoke(id) {
        const res = await safeFetch(`${this.config.endpoint}/artifacts/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${this.config.ownerToken}` },
        });
        if (!res.ok)
            throw new Error(`Revoke failed: ${res.status}`);
    }
}
