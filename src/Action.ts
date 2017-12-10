import { Value, ValueType, TypeMismatchError } from "./Instruction";
import { StackVM } from "./StackVM";

export abstract class Action {
    abstract parameters : ( ValueType | ValueType[] )[];

    expect ( value : Value, types : ValueType | ValueType[] ) : void {
        if ( types instanceof Array ) {
            if ( !types.some( type => value.type == type ) ) {
                throw new TypeMismatchError( types, value.type );
            }
        } else {
            if ( value.type !== types ) {
                throw new TypeMismatchError( types, value.type );
            }
        }
    }

    check ( name : string, parameters : Value<any>[] ) : Error {
        if ( this.parameters.length != parameters.length ) {
            return Error( `Action "${ name }" expected ${ this.parameters.length } arguments, got ${ parameters.length }.` );
        }

        for ( let [ index, parameter ] of parameters.entries() ) {
            const expected = this.parameters[ index ];

            let valid : boolean = true;

            if ( expected instanceof Array ) {
                valid = expected.some( type => parameter.type === type );
            } else {
                valid = expected === parameter.type;
            }

            if ( !valid ) {
                return new TypeMismatchError( expected, parameter.type, `Argument ${ index } of "${ name }"` );
            }
        }

        return null;
    }

    abstract setup ( vm : StackVM ) : void;

    abstract execute ( vm : StackVM, name : string, parameters : Value<any>[] ) : any | Promise<any>;
}