export interface StatusInfo<T> {
    isSuccess: boolean,
    msg: string,
    data?: T
}