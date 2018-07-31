import { Action } from "./Action";
import { StackVM } from "./StackVM";

export class Instruction {
    public name : string;

    public parameters : Value<any>[];

    public action ?: Action = null;

    constructor ( name : string, parameters : Value<any>[] = [] ) {
        this.name = name;
        this.parameters = parameters;
    }
}

export enum ValueType {
    Integer = 0,
    Float = 1,
    String = 2,
    AddressHeap = 3,
    AddressString = 4,
    AddressCode = 5,
    AddressStack = 6
}

export class Value<V = any> {
    type : ValueType;

    value : V;

    constructor ( type : ValueType, value : V ) {
        this.type = type;
        this.value = value;
    }

    clone ( vm ?: StackVM ) : Value<V> {
        if ( vm ) {
            return vm.valuesPool.acquire( this.type, this.value );
        }

        return new Value( this.type, this.value );
    }
}

export class TypeMismatchError extends Error {
    constructor ( expected : ValueType | ValueType[], received : ValueType, prefix : string = null ) {
        super( ( prefix ? ( prefix + ' expected' ) : 'Expected' ) + ` value of type ${ array( expected ).join( ' or ' ) }, got value of type ${ received }.` );
    }
}

export function array<T> ( array : T | T[] ) : T[] {
    if ( array instanceof Array ) {
        return array;
    }

    return [ array ];
}