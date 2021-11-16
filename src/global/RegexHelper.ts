
class RegexHelper {

    static IsValidString = (regex: RegExp, value: string) => regex.test(value)

    static IsInt = (value: string) => /^\d+$/.test(value)
}