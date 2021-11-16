import { Response } from 'express'

export default class rest {

    static Send = (res: Response, code: number, message: any) => {
        res.status(code).send(message);
    }

    static SendSuccess = (req: Response, message: any) => {
        rest.Send(req, 200, message);
    }

    static SendErrorBadRequest = (req: Response, message: any) => {
        rest.Send(req, 400, message);
    }

    static SendErrorForbidden = (req: Response, message: any) => {
        rest.Send(req, 403, message);
    }

    static SendErrorNotFound = (req: Response, message: any) => {
        rest.Send(req, 404, message);
    }

    static SendErrorConflict = (req: Response, message: any) => {
        rest.Send(req, 409, message);
    }

    static SendErrorInternalServer = (req: Response, message: any) => {
        rest.Send(req, 500, message);
    }
}