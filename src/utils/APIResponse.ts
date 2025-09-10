export class APIResponse {
    success: boolean;
    message: string;
    data: null;
    constructor(success: boolean, message: string, data: any = null) {
        this.data = data;
        this.message = message;
        this.success = success;
    }
}
