import { Action } from "./Action";
import { ConcatAction } from "./Actions/Concat";
import { JumpAction, JumpConditionalAction, PushAddressAction, CallAction, ReturnAction, StartAction, NopAction, ErrorAction, StopAction } from "./Actions/Control";
import { StringToIntAction, StringToFloatAction, IntToFloatAction, FloatToIntAction, IntToStringAction, FloatToStringAction } from "./Actions/Convert";
import { DupAction, DupNAction } from "./Actions/Dup";
import { BinaryFloatOp, UnaryFloatOp } from "./Actions/FloatOps";
import { AllocAction, AllocNAction, FreeAction, EqualAction } from "./Actions/Heap";
import { BinaryIntOp, UnaryIntOp } from "./Actions/IntOps";
import { WriteIntegerAction, WriteFloatAction, WriteStringAction, ReadAction } from "./Actions/NodeIO";
import { LoadAction, LoadNAction } from "./Actions/Load";
import { SwapAction, DebugAction } from "./Actions/Misc";
import { PaddAction } from "./Actions/Padd";
import { PopAction, PopNAction } from "./Actions/Pop";
import { PushIntegerAction, PushRepeatAction, PushFloatAction, PushStringAction, PushGlobalOperandAction, PushFrameOperandAction, PushStackAddressAction, PushFrameAddressAction, PushGlobalAddressAction } from "./Actions/Push";
import { StoreFrameAction, StoreGlobalAction, StoreAction, StoreNAction } from "./Actions/Store";
import { FiberKillAction, FiberRunAction, FiberSendAction, FiberSpawnAction, FiberSuspendAction, FiberSwitchAction, FiberYieldAction, FiberYieldNAction, FiberCurrentAction, FiberStatusAction } from "./Actions/Fibers";

export var NodeIoActions : Action[] = [ new WriteIntegerAction(), new WriteFloatAction(), new WriteStringAction(), new ReadAction() ];

export var StdActions : Action[] = [
    new ConcatAction(),
    new JumpAction(), new JumpConditionalAction(), new PushAddressAction(), new CallAction(), new ReturnAction(), new StartAction(), new NopAction(), new ErrorAction(), new StopAction(),
    new StringToIntAction(), new StringToFloatAction(), new IntToFloatAction(), new FloatToIntAction(), new IntToStringAction(), new FloatToStringAction(),
    new DupAction(), new DupNAction(),
    new BinaryFloatOp(), new UnaryFloatOp(),
    new AllocAction(), new AllocNAction(), new FreeAction(), new EqualAction(),
    new BinaryIntOp(), new UnaryIntOp(),
    new FiberKillAction(), new FiberRunAction(), new FiberSendAction(), new FiberSpawnAction(), new FiberSuspendAction(), new FiberSwitchAction(), new FiberYieldAction(), new FiberYieldNAction(),
    new FiberCurrentAction(), new FiberStatusAction,
    ...NodeIoActions,
    new LoadAction(), new LoadNAction(),
    new SwapAction(), new DebugAction(),
    new PaddAction(),
    new PopAction(), new PopNAction(),
    new PushIntegerAction(), new PushRepeatAction(), new PushFloatAction(), new PushStringAction, new PushGlobalOperandAction(), new PushFrameOperandAction(), new PushStackAddressAction(), new PushFrameAddressAction(), new PushGlobalAddressAction(),
    new StoreFrameAction(), new StoreGlobalAction(), new StoreAction(), new StoreNAction()
];