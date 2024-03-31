export function test(functionName: string, func: Function) {
    try {
        func();
    }
    catch (err) {
        console.log(functionName + " failed");
        console.error(err);
    }
}